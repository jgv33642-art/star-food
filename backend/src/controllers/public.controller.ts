import { Request, Response, NextFunction } from 'express';
import { queryWithRLS } from '../config/db';

export class PublicController {
  getMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      
      const companyResult = await queryWithRLS(companyId, 'SELECT id, name, phone FROM companies WHERE id = $1', [companyId]);
      if (companyResult.rows.length === 0) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const categoriesResult = await queryWithRLS(companyId, 'SELECT * FROM categories ORDER BY created_at ASC');
      const productsResult = await queryWithRLS(companyId, 'SELECT * FROM products WHERE active = true ORDER BY name ASC');
      
      res.json({
        company: companyResult.rows[0],
        categories: categoriesResult.rows,
        products: productsResult.rows
      });
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { tableId, items } = req.body;

      if (!tableId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Table ID and items are required' });
      }

      // Create order
      const orderResult = await queryWithRLS(
        companyId,
        `INSERT INTO orders (company_id, table_id, status) VALUES ($1, $2, 'open') RETURNING *`,
        [companyId, tableId]
      );
      const order = orderResult.rows[0];

      // Add order items
      for (const item of items) {
        await queryWithRLS(
          companyId,
          `INSERT INTO order_items (order_id, product_id, quantity, price, notes) VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.productId, item.quantity, item.price, item.notes]
        );
      }

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  };
}
