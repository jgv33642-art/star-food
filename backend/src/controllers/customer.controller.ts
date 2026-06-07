import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';

export class CustomerController {
  private customerService = new CustomerService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const customers = await this.customerService.getAll(companyId);
      res.json(customers);
    } catch (error) {
      next(error);
    }
  };
}
