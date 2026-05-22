import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import fs from 'fs';
import path from 'path';

export class DevController {
  getDiagnostics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diag: any = {
        backend: {
          status: 'connected',
          port: process.env.PORT || '3000',
          nodeEnv: process.env.NODE_ENV || 'development'
        },
        database: {
          status: 'checking',
          message: '',
          tables: {},
          views: {},
          routines: {},
          triggers: {}
        },
        companies: []
      };

      // 1. Try to ping database
      try {
        const pingStart = Date.now();
        await pool.query('SELECT 1');
        const pingTime = Date.now() - pingStart;
        diag.database.status = 'connected';
        diag.database.message = `Conectado com sucesso (${pingTime}ms)`;
        
        // Check existing tables
        const tablesRes = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        const existingTables = tablesRes.rows.map((r: any) => r.table_name);
        
        const expectedTables = [
          'companies', 'roles', 'users', 'categories', 'products', 
          'ingredients', 'product_ingredients', 'tables', 'customers', 
          'orders', 'order_items', 'cash_registers', 'sales', 
          'sale_items', 'payments', 'stock_movements'
        ];
        
        expectedTables.forEach(t => {
          diag.database.tables[t] = existingTables.includes(t);
        });

        // Check existing views
        const viewsRes = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'VIEW'
        `);
        const existingViews = viewsRes.rows.map((r: any) => r.table_name);
        const expectedViews = ['daily_revenue', 'best_selling_products'];
        expectedViews.forEach(v => {
          diag.database.views[v] = existingViews.includes(v);
        });

        // Check triggers and functions
        const routinesRes = await pool.query(`
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' AND routine_name = 'decrease_stock'
        `);
        diag.database.routines['decrease_stock'] = routinesRes.rows.length > 0;

        const triggersRes = await pool.query(`
          SELECT trigger_name 
          FROM information_schema.triggers 
          WHERE trigger_schema = 'public' AND trigger_name = 'trigger_decrease_stock'
        `);
        diag.database.triggers['trigger_decrease_stock'] = triggersRes.rows.length > 0;

        // 2. Fetch real companies if the table exists
        if (diag.database.tables['companies']) {
          const companiesRes = await pool.query('SELECT * FROM companies ORDER BY created_at DESC');
          diag.companies = companiesRes.rows;
        } else {
          diag.companies = [];
        }

      } catch (dbErr: any) {
        diag.database.status = 'error';
        diag.database.message = dbErr.message || 'Erro de conexão com o banco de dados';
        diag.companies = [];
      }

      res.json(diag);
    } catch (error) {
      next(error);
    }
  };

  repairDatabase = async (req: Request, res: Response, next: NextFunction) => {
    const logs: any[] = [];
    const client = await pool.connect();
    try {
      logs.push({ type: 'info', message: 'Iniciando processo de auto-reparo do banco de dados...' });
      
      // Resolve path of database.sql in a robust way for local and Vercel Serverless runtimes
      let sqlPath = path.resolve(process.cwd(), '../database.sql');
      if (!fs.existsSync(sqlPath)) {
        sqlPath = path.resolve(process.cwd(), './database.sql');
      }
      if (!fs.existsSync(sqlPath)) {
        sqlPath = path.resolve(__dirname, '../../../../database.sql');
      }
      if (!fs.existsSync(sqlPath)) {
        sqlPath = path.resolve(__dirname, '../../../database.sql');
      }
      if (!fs.existsSync(sqlPath)) {
        sqlPath = path.resolve(__dirname, '../../database.sql');
      }

      logs.push({ type: 'info', message: `Lendo arquivo de esquema: ${sqlPath}` });

      if (!fs.existsSync(sqlPath)) {
        throw new Error(`Arquivo de esquema não encontrado após buscar em caminhos relativos.`);
      }

      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Parse statements from database.sql
      const statements: string[] = [];
      let currentStatement = '';
      let inDollarQuote = false;
      const lines = sqlContent.split('\n');

      for (const line of lines) {
        currentStatement += line + '\n';
        if (line.includes('$$')) {
          inDollarQuote = !inDollarQuote;
        }
        if (!inDollarQuote && line.trim().endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }

      logs.push({ type: 'info', message: `Total de ${statements.length} instruções SQL carregadas.` });

      // Run each statement
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt) continue;
        
        // Highlight statement summary (first line or first few characters)
        const stmtSummary = stmt.split('\n')[0].substring(0, 80) + (stmt.includes('\n') || stmt.length > 80 ? '...' : '');
        
        try {
          // Special prevention for Roles insert duplication
          if (stmt.toUpperCase().startsWith('INSERT INTO ROLES')) {
            // First check if roles exist
            try {
              const rolesExist = await client.query('SELECT COUNT(*) FROM roles');
              if (parseInt(rolesExist.rows[0].count, 10) > 0) {
                logs.push({ 
                  type: 'skip', 
                  statement: stmtSummary, 
                  message: 'Tabela roles já contém registros. Inserção pulada para evitar duplicidade.' 
                });
                continue;
              }
            } catch (err) {
              // Table roles might not exist yet, that's fine, let INSERT run or let CREATE run first
            }
          }

          // Execute statement
          await client.query(stmt);
          logs.push({ 
            type: 'success', 
            statement: stmtSummary, 
            message: 'Executado com sucesso.' 
          });
        } catch (stmtErr: any) {
          const errMsg = stmtErr.message || '';
          // If table or index or view or policy already exists, log it as warning/info instead of failure
          if (
            errMsg.includes('already exists') || 
            errMsg.includes('já existe')
          ) {
            logs.push({ 
              type: 'info', 
              statement: stmtSummary, 
              message: `Já existe no banco (${errMsg}).` 
            });
          } else {
            logs.push({ 
              type: 'error', 
              statement: stmtSummary, 
              message: `Erro ao executar: ${errMsg}` 
            });
          }
        }
      }

      logs.push({ type: 'success', message: 'Auto-reparo finalizado.' });
      res.json({ success: true, logs });
    } catch (error: any) {
      logs.push({ type: 'error', message: `Falha no processo de auto-reparo: ${error.message}` });
      res.status(500).json({ success: false, error: error.message, logs });
    } finally {
      client.release();
    }
  };

  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, plan, active } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID da empresa é obrigatório.' });
      }

      const result = await pool.query(
        'UPDATE companies SET plan = $1, active = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [plan, active, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Empresa não encontrada.' });
      }

      res.json({ success: true, company: result.rows[0] });
    } catch (error: any) {
      next(error);
    }
  };
}
