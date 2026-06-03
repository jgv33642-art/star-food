import { queryWithRLS } from '../config/db';

export class ProductRepository {
  async findAll(companyId: string) {
    const result = await queryWithRLS(companyId, 'SELECT * FROM products ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(companyId: string, id: string) {
    const result = await queryWithRLS(companyId, 'SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(companyId: string, data: any) {
    const { name, categoryId, description, price, cost, stockQuantity, minimumStock, active, sku } = data;
    const result = await queryWithRLS(
      companyId,
      `INSERT INTO products 
      (company_id, name, category_id, description, price, cost, stock_quantity, minimum_stock, active, sku) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [companyId, name, categoryId, description, price, cost, stockQuantity || 0, minimumStock || 0, active !== undefined ? active : true, sku || null]
    );
    return result.rows[0];
  }

  async update(companyId: string, id: string, data: any) {
    const updates = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        // Map camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = $${i}`);
        values.push(value);
        i++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `UPDATE products SET ${updates.join(', ')}, updated_at = now() WHERE id = $${i} RETURNING *`;
    
    const result = await queryWithRLS(companyId, query, values);
    return result.rows[0];
  }

  async delete(companyId: string, id: string) {
    const result = await queryWithRLS(companyId, 'DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
