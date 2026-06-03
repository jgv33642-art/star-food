import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';

export class OrderService {
  private orderRepository = new OrderRepository();
  private productRepository = new ProductRepository();

  async getAll(companyId: string) {
    return this.orderRepository.findAll(companyId);
  }

  async getById(companyId: string, id: string) {
    const order = await this.orderRepository.findById(companyId, id);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    return order;
  }

  async create(companyId: string, data: { tableId?: string; waiterId?: string }) {
    return this.orderRepository.create(companyId, data);
  }

  async addItem(
    companyId: string,
    orderId: string,
    data: { productId: string; quantity: number; price: number; notes?: string }
  ) {
    // Verify order belongs to this company
    const order = await this.orderRepository.findById(companyId, orderId);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }

    // Verify product is active
    const product = await this.productRepository.findById(companyId, data.productId);
    if (!product) {
      throw { status: 404, message: 'Product not found' };
    }
    if (product.active === false) {
      throw { status: 400, message: 'Produto esgotado' };
    }

    return this.orderRepository.addItem(orderId, data);
  }

  async removeItem(companyId: string, orderId: string, itemId: string) {
    const order = await this.orderRepository.findById(companyId, orderId);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    const deleted = await this.orderRepository.removeItem(orderId, itemId);
    if (!deleted) {
      throw { status: 404, message: 'Item not found' };
    }
    return { message: 'Item removed successfully' };
  }

  async close(companyId: string, id: string) {
    const order = await this.orderRepository.close(companyId, id);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    return order;
  }

  async updateStatus(companyId: string, id: string, status: string) {
    const order = await this.orderRepository.updateStatus(companyId, id, status);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    return order;
  }
}
