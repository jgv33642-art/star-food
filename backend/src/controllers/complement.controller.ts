import { Request, Response, NextFunction } from 'express';
import { ComplementService } from '../services/complement.service';

export class ComplementController {
  private service = new ComplementService();

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getCategories(req.user!.companyId);
      res.json(result);
    } catch (err) { next(err); }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createCategory(req.user!.companyId, req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateCategory(req.user!.companyId, req.params.id, req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deleteCategory(req.user!.companyId, req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  };

  createOption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createOption(req.user!.companyId, req.params.categoryId, req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  updateOption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateOption(req.user!.companyId, req.params.optionId, req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  deleteOption = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.deleteOption(req.user!.companyId, req.params.optionId);
      res.json(result);
    } catch (err) { next(err); }
  };

  // Product Links
  linkToProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.body;
      const result = await this.service.linkToProduct(req.user!.companyId, req.params.productId, categoryId);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  unlinkFromProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.params;
      const result = await this.service.unlinkFromProduct(req.user!.companyId, req.params.productId, categoryId);
      res.json(result);
    } catch (err) { next(err); }
  };

  getProductComplements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getProductComplements(req.user!.companyId, req.params.productId);
      res.json(result);
    } catch (err) { next(err); }
  };
}
