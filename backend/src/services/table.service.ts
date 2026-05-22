import { TableRepository } from '../repositories/table.repository';

export class TableService {
  private tableRepository = new TableRepository();

  async getAll(companyId: string) {
    return this.tableRepository.findAll(companyId);
  }

  async getById(companyId: string, id: string) {
    const table = await this.tableRepository.findById(companyId, id);
    if (!table) {
      throw { status: 404, message: 'Table not found' };
    }
    return table;
  }

  async create(companyId: string, data: any) {
    return this.tableRepository.create(companyId, data);
  }

  async update(companyId: string, id: string, data: any) {
    const table = await this.tableRepository.update(companyId, id, data);
    if (!table) {
      throw { status: 404, message: 'Table not found' };
    }
    return table;
  }

  async delete(companyId: string, id: string) {
    const deleted = await this.tableRepository.delete(companyId, id);
    if (!deleted) {
      throw { status: 404, message: 'Table not found' };
    }
    return { message: 'Table deleted successfully' };
  }
}
