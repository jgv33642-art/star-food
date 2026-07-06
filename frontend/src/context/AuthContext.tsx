import React, { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

export type Role = 'gerencia' | 'caixa' | 'garcom';

export interface User {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  role: Role;
  companyId: string;
  plan: string;
  hasStaff?: boolean;
  companyActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginDevice: (email: string, password: string) => Promise<void>;
  register: (companyName: string, userName: string, email: string, password: string, plan?: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
}

interface BackendUser {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  role_id?: string;
  role?: string;
  companyId?: string;
  company_id?: string;
  plan?: string;
  hasStaff?: boolean;
  companyActive?: boolean;
  company_active?: boolean;
}

interface LoginResponse {
  token: string;
  user: BackendUser;
}

function mapBackendRole(backendUser: BackendUser): Role {
  const roleName = (backendUser.role || '').toLowerCase();
  if (roleName === 'admin' || roleName === 'manager' || roleName === 'gerencia') return 'gerencia';
  if (roleName === 'cashier' || roleName === 'caixa') return 'caixa';
  if (roleName === 'waiter' || roleName === 'garcom' || roleName === 'garçom') return 'garcom';
  // default: if we can't determine, treat as gerencia
  return 'gerencia';
}

function buildUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    name: backendUser.name,
    companyName: backendUser.companyName,
    email: backendUser.email,
    role: mapBackendRole(backendUser),
    companyId: backendUser.companyId || backendUser.company_id || '',
    plan: backendUser.plan || 'pro', // Default to pro if undefined so features work for admins
    hasStaff: backendUser.hasStaff,
    companyActive: backendUser.companyActive ?? backendUser.company_active ?? true,
  };
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function loadUserFromStorage(): User | null {
  try {
    const savedUser = localStorage.getItem('@Lanchonete:user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      return u;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadUserFromStorage);

  const persistUser = (u: User | null, token?: string) => {
    if (u) {
      localStorage.setItem('@Lanchonete:user', JSON.stringify(u));
    } else {
      localStorage.removeItem('@Lanchonete:user');
    }
    if (token !== undefined) {
      if (token) {
        localStorage.setItem('@Lanchonete:token', token);
      } else {
        localStorage.removeItem('@Lanchonete:token');
      }
    }
    setUser(u);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    const mappedUser = buildUser(res.user);
    persistUser(mappedUser, res.token);
    localStorage.setItem('@Lanchonete:companySlug', slugify(res.user.companyName || ''));
  };

  const loginDevice = async (email: string, password: string): Promise<void> => {
    // Valida credenciais na API mas não entra como usuário. Apenas salva o slug do estabelecimento.
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    localStorage.setItem('@Lanchonete:companySlug', slugify(res.user.companyName || ''));
  };

  const register = async (companyName: string, userName: string, email: string, password: string, plan?: string) => {
    const res = await api.post<LoginResponse>('/auth/register', { 
      companyName, 
      userName, 
      email, 
      password, 
      plan 
    });
    // registrants are always admins/gerencia
    const mappedUser = buildUser(res.user);
    persistUser(mappedUser, res.token);
    localStorage.setItem('@Lanchonete:companySlug', slugify(companyName));
  };

  const loginWithToken = (token: string, u: User) => {
    persistUser(u, token);
  };

  const logout = () => {
    persistUser(null, '');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginDevice, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
