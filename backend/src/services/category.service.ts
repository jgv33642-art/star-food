import { CategoryRepository } from '../repositories/category.repository';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async getAll(companyId: string) {
    return this.categoryRepository.findAll(companyId);
  }

  async create(companyId: string, data: any) {
    return this.categoryRepository.create(companyId, data);
  }

  async update(companyId: string, id: string, data: any) {
    const category = await this.categoryRepository.update(companyId, id, data);
    if (!category) {
      throw { status: 404, message: 'Category not found' };
    }
    return category;
  }

  async delete(companyId: string, id: string) {
    const deleted = await this.categoryRepository.delete(companyId, id);
    if (!deleted) {
      throw { status: 404, message: 'Category not found' };
    }
    return { message: 'Category deleted successfully' };
  }
}
