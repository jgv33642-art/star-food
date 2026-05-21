import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { CashierDashboard } from './pages/CashierDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PDV } from './pages/PDV';
import { Tables } from './pages/Tables';

import { Finance } from './pages/Finance';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { Inventory } from './pages/Inventory';
import { Delivery } from './pages/Delivery';
import { DigitalMenu } from './pages/DigitalMenu';
import { Settings } from './pages/Settings';
import { SuperAdmin } from './pages/SuperAdmin';
import { Checkout } from './pages/Checkout';
import { VirtualStore } from './pages/VirtualStore';
import { DevPanel } from './pages/DevPanel';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Se o usuário não tem a role permitida, manda para o hub principal da role dele
    if (user.role === 'gerencia') return <Navigate to="/admin" replace />;
    if (user.role === 'caixa') return <Navigate to="/caixa" replace />;
    return <Navigate to="/mesas" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        user ? (
          user.role === 'gerencia' ? <Navigate to="/admin" replace /> :
          user.role === 'caixa' ? <Navigate to="/caixa" replace /> :
          <Navigate to="/mesas" replace />
        ) : (
          <Landing />
        )
      } />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/checkout" element={user ? <Navigate to="/" replace /> : <Checkout />} />
      <Route path="/saas-admin" element={<SuperAdmin />} />
      <Route path="/dev" element={<DevPanel />} />
      
      {/* Rota Pública do Cardápio Digital (Mesa) */}
      <Route path="/cardapio/:mesaId" element={<DigitalMenu />} />

      {/* Rota Pública da Loja Virtual (Delivery Próprio) */}
      <Route path="/loja/:tenantId" element={<VirtualStore />} />

      <Route 
        path="/pedidos" 
        element={
          <ProtectedRoute allowedRoles={['garcom', 'gerencia']}>
            <WaiterDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/mesas" 
        element={
          <ProtectedRoute allowedRoles={['garcom', 'caixa', 'gerencia']}>
            <Tables />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/pdv" 
        element={
          <ProtectedRoute allowedRoles={['caixa', 'gerencia']}>
            <PDV />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/caixa" 
        element={
          <ProtectedRoute allowedRoles={['caixa', 'gerencia']}>
            <CashierDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/delivery" 
        element={
          <ProtectedRoute allowedRoles={['caixa', 'gerencia']}>
            <Delivery />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Novas Rotas Administrativas */}
      <Route 
        path="/admin/financeiro" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']}>
            <Finance />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/produtos" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']}>
            <Products />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/relatorios" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']}>
            <Reports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/estoque" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']}>
            <Inventory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/configuracoes" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']}>
            <Settings />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
