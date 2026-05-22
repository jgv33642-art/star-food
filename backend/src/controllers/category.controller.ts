import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  private categoryService = new CategoryService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const categories = await this.categoryService.getAll(companyId);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const category = await this.categoryService.create(companyId, req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const category = await this.categoryService.update(companyId, req.params.id, req.body);
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.categoryService.delete(companyId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
