import { IngredientRepository } from '../repositories/ingredient.repository';

export class IngredientService {
  private ingredientRepository = new IngredientRepository();

  async getIngredients(companyId: string) {
    return this.ingredientRepository.findAll(companyId);
  }

  async getIngredientById(companyId: string, id: string) {
    const ingredient = await this.ingredientRepository.findById(companyId, id);
    if (!ingredient) {
      throw { status: 404, message: 'Ingredient not found' };
    }
    return ingredient;
  }

  async createIngredient(companyId: string, data: any) {
    return this.ingredientRepository.create(companyId, data);
  }

  async updateIngredient(companyId: string, id: string, data: any) {
    const ingredient = await this.ingredientRepository.update(companyId, id, data);
    if (!ingredient) {
      throw { status: 404, message: 'Ingredient not found' };
    }
    return ingredient;
  }

  async deleteIngredient(companyId: string, id: string) {
    const deleted = await this.ingredientRepository.delete(companyId, id);
    if (!deleted) {
      throw { status: 404, message: 'Ingredient not found' };
    }
    return { message: 'Ingredient deleted successfully' };
  }

  async getProductIngredients(companyId: string, productId: string) {
    return this.ingredientRepository.getProductIngredients(companyId, productId);
  }

  async addProductIngredient(companyId: string, productId: string, data: any) {
    return this.ingredientRepository.addProductIngredient(companyId, productId, data);
  }

  async removeProductIngredient(companyId: string, id: string) {
    const deleted = await this.ingredientRepository.removeProductIngredient(companyId, id);
    if (!deleted) {
      throw { status: 404, message: 'Product Ingredient not found' };
    }
    return { message: 'Product Ingredient deleted successfully' };
  }
}
