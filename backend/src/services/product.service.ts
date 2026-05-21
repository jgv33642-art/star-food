import { ProductRepository } from '../repositories/product.repository';

export class ProductService {
  private productRepository = new ProductRepository();

  async getProducts(companyId: string) {
    return this.productRepository.findAll(companyId);
  }

  async getProductById(companyId: string, id: string) {
    const product = await this.productRepository.findById(companyId, id);
    if (!product) {
      throw { status: 404, message: 'Product not found' };
    }
    return product;
  }

  async createProduct(companyId: string, data: any) {
    return this.productRepository.create(companyId, data);
  }

  async updateProduct(companyId: string, id: string, data: any) {
    const product = await this.productRepository.update(companyId, id, data);
    if (!product) {
      throw { status: 404, message: 'Product not found' };
    }
    return product;
  }

  async deleteProduct(companyId: string, id: string) {
    const deleted = await this.productRepository.delete(companyId, id);
    if (!deleted) {
      throw { status: 404, message: 'Product not found' };
    }
    return { message: 'Product deleted successfully' };
  }
}
