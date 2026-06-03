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

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL, -- 'start', 'basic', 'pro'
  billing_cycle VARCHAR(50) NOT NULL, -- 'monthly', 'annual'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  gateway_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP DEFAULT now(),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

CREATE OR REPLACE FUNCTION sync_company_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Always keep the companies table in sync with the latest active/past_due subscription
  IF NEW.status IN ('active', 'past_due') THEN
    UPDATE companies SET plan = NEW.plan_type WHERE id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_company_plan
AFTER INSERT OR UPDATE OF plan_type, status ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_company_plan();

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
  sku VARCHAR(100),
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
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  delivery_address TEXT,
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

-- Add delivery columns to orders table for virtual store integration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

\ n C R E A T E   T A B L E   I F   N O T   E X I S T S   s t o r e _ s e t t i n g s   ( \ n     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( ) , \ n     c o m p a n y _ i d   U U I D   R E F E R E N C E S   c o m p a n i e s ( i d )   O N   D E L E T E   C A S C A D E   U N I Q U E , \ n     l o g o _ u r l   T E X T , \ n     b a n n e r _ u r l   T E X T , \ n     p r i m a r y _ c o l o r   V A R C H A R ( 7 )   D E F A U L T   ' # 0 f 1 7 2 a ' , \ n     s e c o n d a r y _ c o l o r   V A R C H A R ( 7 )   D E F A U L T   ' # f 5 9 e 0 b ' , \ n     f o n t _ f a m i l y   V A R C H A R ( 5 0 )   D E F A U L T   ' I n t e r ' , \ n     f a v i c o n _ u r l   T E X T , \ n     s t o r e _ n a m e   V A R C H A R ( 2 5 5 ) , \ n     w h a t s a p p   V A R C H A R ( 2 0 ) , \ n     p h o n e   V A R C H A R ( 2 0 ) , \ n     s o c i a l _ l i n k s   J S O N B   D E F A U L T   ' { \  
 i n s t a g r a m \ :   \ \ ,   \ f a c e b o o k \ :   \ \ } ' : : j s o n b , \ n     i s _ o p e n _ m a n u a l   B O O L E A N   D E F A U L T   t r u e , \ n     o p e n i n g _ h o u r s   J S O N B   D E F A U L T   ' { \ m o n d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 2 3 : 5 9 \ } ] ,   \ t u e s d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 2 3 : 5 9 \ } ] ,   \ w e d n e s d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 2 3 : 5 9 \ } ] ,   \ t h u r s d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 2 3 : 5 9 \ } ] ,   \ f r i d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 0 2 : 0 0 \ } ] ,   \ s a t u r d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 0 2 : 0 0 \ } ] ,   \ s u n d a y \ :   [ { \ o p e n \ :   \ 1 8 : 0 0 \ ,   \ c l o s e \ :   \ 2 3 : 5 9 \ } ] } ' : : j s o n b , \ n     e s t i m a t e d _ d e l i v e r y _ t i m e   I N T E G E R   D E F A U L T   4 5 , \ n     m a x _ d e l i v e r y _ r a d i u s _ k m   N U M E R I C ( 5 , 2 )   D E F A U L T   1 0 . 0 0 , \ n     f e e _ t y p e   V A R C H A R ( 2 0 )   D E F A U L T   ' f i x e d ' , \ n     b a s e _ d e l i v e r y _ f e e   N U M E R I C ( 1 0 , 2 )   D E F A U L T   0 . 0 0 , \ n     f e e _ p e r _ k m   N U M E R I C ( 1 0 , 2 )   D E F A U L T   0 . 0 0 , \ n     m i n i m u m _ o r d e r _ v a l u e   N U M E R I C ( 1 0 , 2 )   D E F A U L T   0 . 0 0 , \ n     s t o r e _ l a t i t u d e   N U M E R I C ( 1 0 , 8 ) , \ n     s t o r e _ l o n g i t u d e   N U M E R I C ( 1 1 , 8 ) , \ n     a c c e p t s _ p i x _ o n l i n e   B O O L E A N   D E F A U L T   f a l s e , \ n     a c c e p t s _ c a r d _ d e l i v e r y   B O O L E A N   D E F A U L T   t r u e , \ n     a c c e p t s _ c a s h   B O O L E A N   D E F A U L T   t r u e , \ n     a c c e p t s _ p i x _ d e l i v e r y   B O O L E A N   D E F A U L T   t r u e , \ n     u p d a t e d _ a t   T I M E S T A M P   D E F A U L T   n o w ( ) \ n ) ; \ n \ n C R E A T E   T A B L E   I F   N O T   E X I S T S   d e l i v e r y _ n e i g h b o r h o o d s   ( \ n     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( ) , \ n     c o m p a n y _ i d   U U I D   R E F E R E N C E S   c o m p a n i e s ( i d )   O N   D E L E T E   C A S C A D E , \ n     n a m e   V A R C H A R ( 2 5 5 )   N O T   N U L L , \ n     f e e   N U M E R I C ( 1 0 , 2 )   D E F A U L T   0 . 0 0 , \ n     a c t i v e   B O O L E A N   D E F A U L T   t r u e , \ n     c r e a t e d _ a t   T I M E S T A M P   D E F A U L T   n o w ( ) \ n ) ; \ n  
 