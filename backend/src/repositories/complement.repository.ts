import { queryWithRLS } from '../config/db';

export class ComplementRepository {
  async getCategories(companyId: string) {
    // Busca categorias
    const catResult = await queryWithRLS(companyId, 'SELECT * FROM complement_categories WHERE company_id = $1 ORDER BY name', [companyId]);
    const categories = catResult.rows;

    if (categories.length === 0) return [];

    // Busca opções dessas categorias
    const categoryIds = categories.map(c => c.id);
    const compResult = await queryWithRLS(companyId, `
      SELECT * FROM complements 
      WHERE complement_category_id = ANY($1::uuid[]) 
      ORDER BY name
    `, [categoryIds]);

    const complements = compResult.rows;

    // Monta o objeto aninhado
    return categories.map(cat => ({
      ...cat,
      options: complements.filter(c => c.complement_category_id === cat.id)
    }));
  }

  async createCategory(companyId: string, data: any) {
    const { name, isRequired, minOptions, maxOptions } = data;
    const result = await queryWithRLS(
      companyId,
      `INSERT INTO complement_categories (company_id, name, is_required, min_options, max_options) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, name, isRequired || false, minOptions || 0, maxOptions || 1]
    );
    return result.rows[0];
  }

  async updateCategory(companyId: string, id: string, data: any) {
    const { name, isRequired, minOptions, maxOptions } = data;
    const result = await queryWithRLS(
      companyId,
      `UPDATE complement_categories 
       SET name = $1, is_required = $2, min_options = $3, max_options = $4, updated_at = now() 
       WHERE id = $5 AND company_id = $6 RETURNING *`,
      [name, isRequired, minOptions, maxOptions, id, companyId]
    );
    return result.rows[0];
  }

  async deleteCategory(companyId: string, id: string) {
    const result = await queryWithRLS(companyId, 'DELETE FROM complement_categories WHERE id = $1 AND company_id = $2 RETURNING id', [id, companyId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createOption(companyId: string, categoryId: string, data: any) {
    const { name, price } = data;
    // Check if category belongs to company via RLS / join
    const catCheck = await queryWithRLS(companyId, 'SELECT id FROM complement_categories WHERE id = $1 AND company_id = $2', [categoryId, companyId]);
    if (catCheck.rows.length === 0) throw new Error('Category not found');

    const result = await queryWithRLS(
      companyId,
      `INSERT INTO complements (complement_category_id, name, price) VALUES ($1, $2, $3) RETURNING *`,
      [categoryId, name, price || 0]
    );
    return result.rows[0];
  }

  async updateOption(companyId: string, optionId: string, data: any) {
    const { name, price } = data;
    // We must ensure the option belongs to a category of this company
    const result = await queryWithRLS(companyId, `
      UPDATE complements c
      SET name = $1, price = $2, updated_at = now()
      FROM complement_categories cc
      WHERE c.complement_category_id = cc.id AND c.id = $3 AND cc.company_id = $4
      RETURNING c.*
    `, [name, price, optionId, companyId]);
    return result.rows[0];
  }

  async deleteOption(companyId: string, optionId: string) {
    const result = await queryWithRLS(companyId, `
      DELETE FROM complements c
      USING complement_categories cc
      WHERE c.complement_category_id = cc.id AND c.id = $1 AND cc.company_id = $2
      RETURNING c.id
    `, [optionId, companyId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // --- Links with Products ---
  async linkCategoryToProduct(companyId: string, productId: string, categoryId: string) {
    const result = await queryWithRLS(companyId, `
      INSERT INTO product_complement_categories (product_id, complement_category_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *
    `, [productId, categoryId]);
    return result.rows[0] || true;
  }

  async unlinkCategoryFromProduct(companyId: string, productId: string, categoryId: string) {
    const result = await queryWithRLS(companyId, `
      DELETE FROM product_complement_categories WHERE product_id = $1 AND complement_category_id = $2
      RETURNING id
    `, [productId, categoryId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getProductComplementCategories(companyId: string, productId: string) {
    const result = await queryWithRLS(companyId, `
      SELECT cc.* 
      FROM complement_categories cc
      JOIN product_complement_categories pcc ON pcc.complement_category_id = cc.id
      WHERE pcc.product_id = $1 AND cc.company_id = $2
      ORDER BY cc.name
    `, [productId, companyId]);

    const categories = result.rows;
    if (categories.length === 0) return [];

    const categoryIds = categories.map(c => c.id);
    const compResult = await queryWithRLS(companyId, `
      SELECT * FROM complements 
      WHERE complement_category_id = ANY($1::uuid[]) 
      ORDER BY name
    `, [categoryIds]);

    const complements = compResult.rows;

    return categories.map(cat => ({
      ...cat,
      options: complements.filter(c => c.complement_category_id === cat.id)
    }));
  }
}
