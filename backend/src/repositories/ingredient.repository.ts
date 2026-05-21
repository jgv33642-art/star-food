import { queryWithRLS } from '../config/db';

export class IngredientRepository {
  async findAll(companyId: string) {
    const result = await queryWithRLS(companyId, 'SELECT * FROM ingredients ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(companyId: string, id: string) {
    const result = await queryWithRLS(companyId, 'SELECT * FROM ingredients WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(companyId: string, data: any) {
    const { name, unit, stockQuantity, minimumStock } = data;
    const result = await queryWithRLS(
      companyId,
      `INSERT INTO ingredients 
      (company_id, name, unit, stock_quantity, minimum_stock) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, name, unit, stockQuantity || 0, minimumStock || 0]
    );
    return result.rows[0];
  }

  async update(companyId: string, id: string, data: any) {
    const updates = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = $${i}`);
        values.push(value);
        i++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `UPDATE ingredients SET ${updates.join(', ')}, updated_at = now() WHERE id = $${i} RETURNING *`;
    
    const result = await queryWithRLS(companyId, query, values);
    return result.rows[0];
  }

  async delete(companyId: string, id: string) {
    const result = await queryWithRLS(companyId, 'DELETE FROM ingredients WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getProductIngredients(companyId: string, productId: string) {
    const result = await queryWithRLS(
      companyId, 
      `SELECT pi.*, i.name, i.unit 
       FROM product_ingredients pi
       JOIN ingredients i ON i.id = pi.ingredient_id
       WHERE pi.product_id = $1`, 
      [productId]
    );
    return result.rows;
  }

  async addProductIngredient(companyId: string, productId: string, data: any) {
    const { ingredientId, quantity } = data;
    const result = await queryWithRLS(
      companyId,
      `INSERT INTO product_ingredients (product_id, ingredient_id, quantity) 
       VALUES ($1, $2, $3) RETURNING *`,
      [productId, ingredientId, quantity]
    );
    return result.rows[0];
  }

  async removeProductIngredient(companyId: string, id: string) {
    const result = await queryWithRLS(companyId, 'DELETE FROM product_ingredients WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
