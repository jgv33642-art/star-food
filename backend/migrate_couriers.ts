import { pool } from './src/config/db';

async function migrate() {
  try {
    console.log('Iniciando migração...');
    const client = await pool.connect();
    
    // Tabela Couriers
    await client.query(`
      CREATE TABLE IF NOT EXISTS couriers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        vehicle VARCHAR(100),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    
    console.log('Tabela couriers criada/verificada.');

    // Adicionar colunas em orders
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
    `);

    console.log('Colunas courier_id e delivery_fee adicionadas em orders.');

    // Adicionar a tabela couriers no arquivo database.sql para manter o registro
    // Isso é feito manualmente depois.

    client.release();
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
