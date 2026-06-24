import { ComplementRepository } from '../repositories/complement.repository';

export class ComplementService {
  private repo = new ComplementRepository();

  async getCategories(companyId: string) {
    return this.repo.getCategories(companyId);
  }

  async createCategory(companyId: string, data: any) {
    return this.repo.createCategory(companyId, data);
  }

  async updateCategory(companyId: string, id: string, data: any) {
    return this.repo.updateCategory(companyId, id, data);
  }

  async deleteCategory(companyId: string, id: string) {
    const deleted = await this.repo.deleteCategory(companyId, id);
    if (!deleted) throw { status: 404, message: 'Category not found' };
    return { message: 'Deleted successfully' };
  }

  async createOption(companyId: string, categoryId: string, data: any) {
    return this.repo.createOption(companyId, categoryId, data);
  }

  async updateOption(companyId: string, optionId: string, data: any) {
    const updated = await this.repo.updateOption(companyId, optionId, data);
    if (!updated) throw { status: 404, message: 'Option not found' };
    return updated;
  }

  async deleteOption(companyId: string, optionId: string) {
    const deleted = await this.repo.deleteOption(companyId, optionId);
    if (!deleted) throw { status: 404, message: 'Option not found' };
    return { message: 'Deleted successfully' };
  }

  // Links with product
  async linkToProduct(companyId: string, productId: string, categoryId: string) {
    return this.repo.linkCategoryToProduct(companyId, productId, categoryId);
  }

  async unlinkFromProduct(companyId: string, productId: string, categoryId: string) {
    const deleted = await this.repo.unlinkCategoryFromProduct(companyId, productId, categoryId);
    if (!deleted) throw { status: 404, message: 'Link not found' };
    return { message: 'Unlinked successfully' };
  }

  async getProductComplements(companyId: string, productId: string) {
    return this.repo.getProductComplementCategories(companyId, productId);
  }
}
