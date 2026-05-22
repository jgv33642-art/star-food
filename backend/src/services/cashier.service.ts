import { CashierRepository } from '../repositories/cashier.repository';

export class CashierService {
  private cashierRepository = new CashierRepository();

  async getCurrent(companyId: string) {
    const register = await this.cashierRepository.findCurrent(companyId);
    if (!register) {
      throw { status: 404, message: 'No open cash register found' };
    }
    return register;
  }

  async open(companyId: string, userId: string, openingBalance: number) {
    // Check if there is already an open register
    const existing = await this.cashierRepository.findCurrent(companyId);
    if (existing) {
      throw { status: 409, message: 'There is already an open cash register' };
    }
    return this.cashierRepository.open(companyId, userId, openingBalance);
  }

  async close(companyId: string, id: string, userId: string, closingBalance: number) {
    const register = await this.cashierRepository.close(companyId, id, userId, closingBalance);
    if (!register) {
      throw { status: 404, message: 'Cash register not found' };
    }
    return register;
  }
}
