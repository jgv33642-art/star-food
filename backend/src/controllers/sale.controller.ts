import { Request, Response, NextFunction } from 'express';
import { SaleService } from '../services/sale.service';

export class SaleController {
  private saleService = new SaleService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const sales = await this.saleService.getAll(companyId);
      res.json(sales);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const sale = await this.saleService.getById(companyId, req.params.id);
      res.json(sale);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const sale = await this.saleService.create(companyId, req.body);
      res.status(201).json(sale);
    } catch (error) {
      next(error);
    }
  };
}
