import { pool } from '../config/db';
import fs from 'fs';
import path from 'path';

let migrationPromise: Promise<void> | null = null;

export function runAutoMigration(): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    console.log('[AUTO-MIGRATION] Checking database schema...');
    
    let client;
    try {
      client = await pool.connect();
    } catch (err: any) {
      console.warn('[AUTO-MIGRATION] Could not connect to database to verify schema. Skipping auto-migration.', err.message);
      return;
    }

    try {
      // Check existing tables count
      const tablesRes = await client.query(`
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      const existingTablesCount = parseInt(tablesRes.rows[0].count, 10);

      console.log(`[AUTO-MIGRATION] Found ${existingTablesCount} existing tables.`);

      // If tables are missing, run the database.sql migration
      if (existingTablesCount < 5) {
        console.log('[AUTO-MIGRATION] Database schema is incomplete. Starting schema restoration...');
        
        // Find database.sql
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

        if (!fs.existsSync(sqlPath)) {
          console.error(`[AUTO-MIGRATION] schema file database.sql not found!`);
          return;
        }

        console.log(`[AUTO-MIGRATION] Reading schema file: ${sqlPath}`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Parse statements
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

        console.log(`[AUTO-MIGRATION] Running ${statements.length} SQL statements...`);

        for (const stmt of statements) {
          if (!stmt) continue;
          const stmtSummary = stmt.split('\n')[0].substring(0, 80);
          
          try {
            // Special prevention for Roles insert duplication
            if (stmt.toUpperCase().startsWith('INSERT INTO ROLES')) {
              try {
                const rolesExist = await client.query('SELECT COUNT(*) FROM roles');
                if (parseInt(rolesExist.rows[0].count, 10) > 0) {
                  continue;
                }
              } catch (err) {
                // Roles table might not exist yet
              }
            }

            await client.query(stmt);
          } catch (stmtErr: any) {
            const errMsg = stmtErr.message || '';
            if (!errMsg.includes('already exists') && !errMsg.includes('já existe')) {
              console.warn(`[AUTO-MIGRATION] Error running statement [${stmtSummary}]: ${errMsg}`);
            }
          }
        }

        console.log('[AUTO-MIGRATION] Database schema migration completed successfully!');
      } else {
        console.log('[AUTO-MIGRATION] Database schema is already present. No actions needed.');
      }
    } catch (migrationErr: any) {
      console.error('[AUTO-MIGRATION] Fatal migration error:', migrationErr);
    } finally {
      client.release();
    }
  })();

  return migrationPromise;
}
