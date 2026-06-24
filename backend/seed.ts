import { AuthService } from './src/services/auth.service';
import { UserRepository } from './src/repositories/user.repository';
import bcrypt from 'bcryptjs';
import { pool } from './src/config/db';

async function seed() {
  console.log('Iniciando criação de conta de teste...');
  const authService = new AuthService();
  const userRepo = new UserRepository();

  try {
    // 1. Criar o Estabelecimento "Teste"
    const companyName = "Teste";
    const password = "33642";
    
    let adminResult;
    try {
      console.log('Registrando estabelecimento...');
      adminResult = await authService.register({
        companyName,
        password,
        plan: 'pro'
      });
      console.log('Estabelecimento criado!', adminResult.user);
    } catch (e: any) {
      if (e.message?.includes('Já existe um estabelecimento')) {
        console.log('Estabelecimento já existe, buscando...');
        const user = await userRepo.findByEmail('teste@starfood.local');
        adminResult = { user: { companyId: user.company_id } };
      } else {
        throw e;
      }
    }

    const companyId = adminResult.user.companyId;

    // 2. Criar a Equipe
    console.log('Criando equipe...');
    const roles = {
      manager: await userRepo.findRoleByName('manager'),
      waiter: await userRepo.findRoleByName('waiter'),
      cashier: await userRepo.findRoleByName('cashier')
    };

    const staff = [
      { name: 'João gerente', roleId: roles.manager.id, pin: '111' },
      { name: 'João 1', roleId: roles.waiter.id, pin: '222' },
      { name: 'João 2', roleId: roles.cashier.id, pin: '333' },
      { name: 'João 3', roleId: roles.waiter.id, pin: '444' }
    ];

    for (const member of staff) {
      const email = `staff_${Date.now()}_${Math.random()}@starfood.local`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(member.pin, salt); // Usamos a senha PIN de teste 111, 222, etc
      
      await userRepo.createUser({
        companyId,
        roleId: member.roleId,
        name: member.name,
        email,
        password: hashedPassword
      });
      console.log(`Equipe criada: ${member.name} com PIN: ${member.pin}`);
    }

    console.log('Seed completo!');
  } catch (err) {
    console.error('Erro no seed:', err);
  } finally {
    await pool.end();
  }
}

seed();
