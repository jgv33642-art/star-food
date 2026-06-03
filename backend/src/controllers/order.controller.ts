import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { emitToCompany } from '../services/socket.service';

export class OrderController {
  private orderService = new OrderService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const orders = await this.orderService.getAll(companyId);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const order = await this.orderService.getById(companyId, req.params.id);
      res.json(order);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const order = await this.orderService.create(companyId, req.body);
      res.status(201).json(order);

      // 🔴 WebSocket: notifica o caixa/cozinha em tempo real
      emitToCompany(companyId, 'new_order', {
        id: order.id,
        table: order.table_number || order.table_id,
        status: order.status,
        customer: order.customer_name,
        createdAt: order.created_at,
      });
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const item = await this.orderService.addItem(companyId, req.params.id, req.body);
      res.status(201).json(item);

      // 🔔 Notifica item adicionado (útil para KDS)
      emitToCompany(companyId, 'order_item_added', {
        orderId: req.params.id,
        item,
      });
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.orderService.removeItem(companyId, req.params.id, req.params.itemId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const order = await this.orderService.close(companyId, req.params.id);
      res.json(order);

      // ✅ WebSocket: pedido fechado
      emitToCompany(companyId, 'order_closed', {
        id: req.params.id,
        closedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const { status } = req.body;
      const order = await this.orderService.updateStatus(companyId, req.params.id, status);
      res.json(order);

      // 🔄 WebSocket: status atualizado (ex: "em preparo", "pronto")
      emitToCompany(companyId, 'order_status_changed', {
        id: req.params.id,
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}
