CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'basic',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL
);

INSERT INTO roles (name) VALUES
('admin'), ('manager'), ('cashier'), ('waiter');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_company ON users(company_id);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255),
  description TEXT,
  price NUMERIC(10,2),
  cost NUMERIC(10,2),
  stock_quantity NUMERIC(10,2) DEFAULT 0,
  minimum_stock NUMERIC(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_products_company ON products(company_id);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  unit VARCHAR(50),
  stock_quantity NUMERIC(10,2) DEFAULT 0,
  minimum_stock NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2)
);

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  number INTEGER,
  status VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  birth_date DATE,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id),
  waiter_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT now(),
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC(10,2),
  price NUMERIC(10,2),
  notes TEXT
);

CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES users(id),
  closed_by UUID REFERENCES users(id),
  opening_balance NUMERIC(10,2),
  closing_balance NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT now(),
  closed_at TIMESTAMP
);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  cash_register_id UUID REFERENCES cash_registers(id),
  customer_id UUID REFERENCES customers(id),
  total_amount NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0,
  final_amount NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC(10,2),
  price NUMERIC(10,2)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  method VARCHAR(50),
  amount NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  ingredient_id UUID REFERENCES ingredients(id),
  type VARCHAR(50),
  quantity NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT now()
);

CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  rec RECORD;
BEGIN
  -- Get company_id from sale
  SELECT company_id INTO v_company_id FROM sales WHERE id = NEW.sale_id;

  -- 1. Decrease product stock
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;

  INSERT INTO stock_movements (
    id, company_id, product_id, type, quantity
  )
  VALUES (
    uuid_generate_v4(), v_company_id, NEW.product_id, 'sale_product', NEW.quantity
  );

  -- 2. Decrease ingredients stock
  FOR rec IN (SELECT ingredient_id, quantity FROM product_ingredients WHERE product_id = NEW.product_id)
  LOOP
    UPDATE ingredients
    SET stock_quantity = stock_quantity - (rec.quantity * NEW.quantity)
    WHERE id = rec.ingredient_id;
    
    INSERT INTO stock_movements (
      id, company_id, ingredient_id, type, quantity
    )
    VALUES (
      uuid_generate_v4(), v_company_id, rec.ingredient_id, 'sale_ingredient', rec.quantity * NEW.quantity
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_stock
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock();

CREATE VIEW daily_revenue AS
SELECT
  company_id,
  DATE(created_at) as day,
  SUM(final_amount) as total
FROM sales
GROUP BY company_id, DATE(created_at);

CREATE VIEW best_selling_products AS
SELECT
  p.name,
  SUM(si.quantity) as total_sold
FROM sale_items si
JOIN products p ON p.id = si.product_id
GROUP BY p.name
ORDER BY total_sold DESC;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_isolation_products
ON products
FOR ALL
USING (company_id = (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid);
