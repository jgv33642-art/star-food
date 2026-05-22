import { SaleRepository } from '../repositories/sale.repository';

export class SaleService {
  private saleRepository = new SaleRepository();

  async getAll(companyId: string) {
    return this.saleRepository.findAll(companyId);
  }

  async getById(companyId: string, id: string) {
    const sale = await this.saleRepository.findById(companyId, id);
    if (!sale) {
      throw { status: 404, message: 'Sale not found' };
    }
    return sale;
  }

  async create(
    companyId: string,
    data: {
      orderId?: string;
      cashRegisterId?: string;
      customerId?: string;
      totalAmount: number;
      discount: number;
      finalAmount: number;
      items: { productId: string; quantity: number; price: number }[];
    }
  ) {
    return this.saleRepository.create(companyId, data);
  }
}
