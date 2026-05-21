import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'gerencia' | 'caixa' | 'garcom';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role, customName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('@Lanchonete:user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('@Lanchonete:user', JSON.stringify(user));
    } else {
      localStorage.removeItem('@Lanchonete:user');
    }
  }, [user]);

  const login = (email: string, role: Role, customName?: string) => {
    // Para simplificar e permitir testar a interface, o login simula a entrada
    setUser({
      id: Math.random().toString(36).substring(2, 9),
      name: customName || email.split('@')[0],
      email,
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
