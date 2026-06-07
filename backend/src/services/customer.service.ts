import { CustomerRepository } from '../repositories/customer.repository';

export class CustomerService {
  private customerRepository = new CustomerRepository();

  async getAll(companyId: string) {
    return this.customerRepository.findAll(companyId);
  }
}
