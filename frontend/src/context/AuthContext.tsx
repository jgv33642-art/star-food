import React, { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

export type Role = 'gerencia' | 'caixa' | 'garcom';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (companyName: string, userName: string, email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
}

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role_id?: string;
  role?: string;
  companyId?: string;
  company_id?: string;
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

function buildUser(backendUser: BackendUser, defaultRole: Role = 'gerencia'): User {
  return {
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    role: backendUser.role ? mapBackendRole(backendUser) : defaultRole,
    companyId: backendUser.companyId || backendUser.company_id || '',
  };
}

function loadUserFromStorage(): User | null {
  try {
    const savedUser = localStorage.getItem('@Lanchonete:user');
    if (savedUser) return JSON.parse(savedUser);
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
    const mappedUser = buildUser(res.user, 'gerencia');
    persistUser(mappedUser, res.token);
  };

  const register = async (companyName: string, userName: string, email: string, password: string): Promise<void> => {
    const res = await api.post<LoginResponse>('/auth/register', { companyName, userName, email, password });
    // registrants are always admins/gerencia
    const mappedUser = buildUser(res.user, 'gerencia');
    persistUser(mappedUser, res.token);
  };

  const loginWithToken = (token: string, u: User) => {
    persistUser(u, token);
  };

  const logout = () => {
    persistUser(null, '');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithToken, logout }}>
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
