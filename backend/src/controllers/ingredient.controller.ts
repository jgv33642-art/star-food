import { Request, Response, NextFunction } from 'express';
import { IngredientService } from '../services/ingredient.service';

export class IngredientController {
  private ingredientService = new IngredientService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const ingredients = await this.ingredientService.getIngredients(companyId);
      res.json(ingredients);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const ingredient = await this.ingredientService.getIngredientById(companyId, req.params.id);
      res.json(ingredient);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const ingredient = await this.ingredientService.createIngredient(companyId, req.body);
      res.status(201).json(ingredient);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const ingredient = await this.ingredientService.updateIngredient(companyId, req.params.id, req.body);
      res.json(ingredient);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.ingredientService.deleteIngredient(companyId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getProductIngredients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.ingredientService.getProductIngredients(companyId, req.params.productId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  addProductIngredient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.ingredientService.addProductIngredient(companyId, req.params.productId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  removeProductIngredient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.ingredientService.removeProductIngredient(companyId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
