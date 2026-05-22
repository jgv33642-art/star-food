import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';

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
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const item = await this.orderService.addItem(companyId, req.params.id, req.body);
      res.status(201).json(item);
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
    } catch (error) {
      next(error);
    }
  };
}
