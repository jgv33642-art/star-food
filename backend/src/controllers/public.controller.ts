import { Request, Response, NextFunction } from 'express';
import { queryWithRLS } from '../config/db';

export class PublicController {
  getTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tableId } = req.params;
      const tableResult = await queryWithRLS(
        undefined,
        'SELECT * FROM tables WHERE id = $1',
        [tableId]
      );
      if (tableResult.rows.length === 0) {
        return res.status(404).json({ message: 'Table not found' });
      }
      res.json(tableResult.rows[0]);
    } catch (error) {
      next(error);
    }
  };

  getMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      
      const companyResult = await queryWithRLS(companyId, 'SELECT id, name, phone, whatsapp_number, is_delivery_open, operating_hours, delivery_fee FROM companies WHERE id = $1', [companyId]);
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
      const { tableId, items, customerName, customerPhone, deliveryAddress } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Items are required' });
      }

      // Verify all products in order are active
      for (const item of items) {
        const productResult = await queryWithRLS(
          companyId,
          'SELECT active FROM products WHERE id = $1',
          [item.productId || item.product_id]
        );
        if (productResult.rows.length === 0) {
          return res.status(404).json({ message: 'Produto não encontrado' });
        }
        if (productResult.rows[0].active === false) {
          return res.status(400).json({ message: 'Produto esgotado' });
        }
      }

      // Create order
      const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderResult = await queryWithRLS(
        companyId,
        `INSERT INTO orders (company_id, table_id, status, customer_name, customer_phone, delivery_address, tracking_code) VALUES ($1, $2, 'open', $3, $4, $5, $6) RETURNING *`,
        [companyId, tableId || null, customerName || null, customerPhone || null, deliveryAddress || null, trackingCode]
      );
      const order = orderResult.rows[0];

      // Add order items
      for (const item of items) {
        await queryWithRLS(
          companyId,
          `INSERT INTO order_items (order_id, product_id, quantity, price, notes) VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.productId || item.product_id, item.quantity, item.price, item.notes]
        );
      }

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  };

  validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: 'Código não informado' });
      
      const result = await queryWithRLS(companyId, 'SELECT * FROM coupons WHERE company_id = $1 AND code = $2 AND active = true', [companyId, code.toUpperCase().trim()]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Cupom inválido ou expirado' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  };

  getOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, trackingCode } = req.params;
      const result = await queryWithRLS(companyId, 'SELECT id, status, tracking_code FROM orders WHERE company_id = $1 AND tracking_code = $2', [companyId, trackingCode]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  };
}
