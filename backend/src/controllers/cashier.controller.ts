import { Request, Response, NextFunction } from 'express';
import { CashierService } from '../services/cashier.service';

export class CashierController {
  private cashierService = new CashierService();

  getCurrent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const register = await this.cashierService.getCurrent(companyId);
      res.json(register);
    } catch (error) {
      next(error);
    }
  };

  open = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { openingBalance } = req.body;
      const register = await this.cashierService.open(companyId, userId, openingBalance);
      res.status(201).json(register);
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.userId;
      const { id, closingBalance } = req.body;
      const register = await this.cashierService.close(companyId, id, userId, closingBalance);
      res.json(register);
    } catch (error) {
      next(error);
    }
  };
}
