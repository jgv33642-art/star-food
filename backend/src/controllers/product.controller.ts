import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  private productService = new ProductService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const products = await this.productService.getProducts(companyId);
      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const product = await this.productService.getProductById(companyId, req.params.id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const product = await this.productService.createProduct(companyId, req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const product = await this.productService.updateProduct(companyId, req.params.id, req.body);
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.productService.deleteProduct(companyId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
