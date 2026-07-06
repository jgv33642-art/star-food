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

      // Incremental updates for user subscription seats
      console.log('[AUTO-MIGRATION] Running incremental schema updates for company access seats...');
      await client.query(`
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS extra_cashiers INTEGER DEFAULT 0;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS extra_managers INTEGER DEFAULT 0;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS extra_waiters INTEGER DEFAULT 0;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS operating_hours JSONB;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_delivery_open BOOLEAN DEFAULT true;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 5.00;
      `);
      
      console.log('[AUTO-MIGRATION] Running incremental updates for products SKU and images...');
      await client.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);
      
      console.log('[AUTO-MIGRATION] Creating invoice import tables if missing...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS invoice_inputs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          access_key VARCHAR(44) UNIQUE,
          supplier_cnpj VARCHAR(14) NOT NULL,
          supplier_name VARCHAR(255) NOT NULL,
          total_value NUMERIC(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT now()
        );
        
        CREATE TABLE IF NOT EXISTS coupons (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          code VARCHAR(50) NOT NULL,
          discount_type VARCHAR(20) DEFAULT 'PERCENTAGE',
          discount_value NUMERIC(10,2) NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT now()
        );
        
        CREATE TABLE IF NOT EXISTS invoice_input_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          invoice_input_id UUID REFERENCES invoice_inputs(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE SET NULL,
          supplier_code VARCHAR(100),
          ean VARCHAR(14),
          name VARCHAR(255) NOT NULL,
          quantity NUMERIC(10,2) NOT NULL,
          cost_price NUMERIC(10,2) NOT NULL
        );
      `);

      console.log('[AUTO-MIGRATION] Creating Complements tables if missing...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS complement_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          is_required BOOLEAN DEFAULT false,
          min_options INTEGER DEFAULT 0,
          max_options INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS complements (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          complement_category_id UUID REFERENCES complement_categories(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          price NUMERIC(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS product_complement_categories (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          complement_category_id UUID REFERENCES complement_categories(id) ON DELETE CASCADE
        );

        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS complements JSONB DEFAULT '[]'::jsonb;
      `);
      
      console.log('[AUTO-MIGRATION] Incremental schema updates completed.');

      console.log('[AUTO-MIGRATION] Ensuring payments table columns for checkout...');
      await client.query(`
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        ALTER TABLE invoice_inputs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
      `);

      console.log('[AUTO-MIGRATION] Running incremental updates for orders (tracking code)...');
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(20);
      `);

      // Add composite unique constraint safely for coupons
      try {
        await client.query(`
          ALTER TABLE coupons ADD CONSTRAINT unique_company_code UNIQUE (company_id, code);
        `);
      } catch (err: any) {
        if (!err.message.includes('already exists') && !err.message.includes('já existe')) {
          console.warn('[AUTO-MIGRATION] Warning: ' + err.message);
        }
      }
      
      await client.query(`
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10,2) DEFAULT 0;
      `);

      // ── Composite indexes for multi-tenant isolation & performance ────────────
      // These indexes ensure every tenant-scoped query hits (company_id, id)
      // which both speeds up lookups AND prevents cross-tenant data leaks via
      // sequential scans that might expose row counts or timing side-channels.
      console.log('[AUTO-MIGRATION] Ensuring composite tenant isolation indexes...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_company_id_id
          ON users(company_id, id);

        CREATE INDEX IF NOT EXISTS idx_products_company_id_id
          ON products(company_id, id);

        CREATE INDEX IF NOT EXISTS idx_products_company_active
          ON products(company_id, active);

        CREATE INDEX IF NOT EXISTS idx_categories_company_id_id
          ON categories(company_id, id);

        CREATE INDEX IF NOT EXISTS idx_orders_company_id_id
          ON orders(company_id, id);

        CREATE INDEX IF NOT EXISTS idx_orders_company_status
          ON orders(company_id, status);

        CREATE INDEX IF NOT EXISTS idx_invoice_inputs_company_id_id
          ON invoice_inputs(company_id, id);

        CREATE INDEX IF NOT EXISTS idx_invoice_inputs_company_access_key
          ON invoice_inputs(company_id, access_key);

        CREATE INDEX IF NOT EXISTS idx_invoice_input_items_invoice_id
          ON invoice_input_items(invoice_input_id);
      `);
      console.log('[AUTO-MIGRATION] Composite indexes verified.');

      console.log('[AUTO-MIGRATION] Default admin creation block disabled.');

    } catch (migrationErr: any) {
      console.error('[AUTO-MIGRATION] Fatal migration error:', migrationErr);
    } finally {
      if (client) client.release();
    }
  })();

  return migrationPromise;
}
