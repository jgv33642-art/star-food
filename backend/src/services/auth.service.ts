import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';

export class AuthService {
  private userRepository = new UserRepository();

  async login(data: any) {
    const { email, password } = data;

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.active) {
      throw { status: 401, message: 'Invalid credentials or inactive user' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const token = generateToken({
      userId: user.id,
      companyId: user.company_id,
      role: user.role_id, // Could map to role name by joining
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.company_id,
      },
    };
  }

  async register(data: any) {
    const { companyName, userName, email, password } = data;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw { status: 400, message: 'Email already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Company
    const company = await this.userRepository.createCompany(companyName);

    // Get Admin Role
    const role = await this.userRepository.findRoleByName('admin');
    if (!role) {
      throw { status: 500, message: 'Default roles not configured' };
    }

    // Create Admin User for Company
    const user = await this.userRepository.createUser({
      companyId: company.id,
      roleId: role.id,
      name: userName,
      email,
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user.id,
      companyId: company.id,
      role: user.role_id,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: company.id,
      },
    };
  }
}
