import { Request, Response, NextFunction } from 'express';
import { TableService } from '../services/table.service';

export class TableController {
  private tableService = new TableService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const tables = await this.tableService.getAll(companyId);
      res.json(tables);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const table = await this.tableService.getById(companyId, req.params.id);
      res.json(table);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const table = await this.tableService.create(companyId, req.body);
      res.status(201).json(table);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const table = await this.tableService.update(companyId, req.params.id, req.body);
      res.json(table);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.tableService.delete(companyId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
