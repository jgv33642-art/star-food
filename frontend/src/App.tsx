import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

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
import { Categories } from './pages/Categories';
import { Ingredients } from './pages/Ingredients';
import { Reports } from './pages/Reports';
import { Inventory } from './pages/Inventory';
import { Delivery } from './pages/Delivery';
import { DigitalMenu } from './pages/DigitalMenu';
import { Settings } from './pages/Settings';
import { DeliverySettings } from './pages/admin/DeliverySettings';
import { Integrations } from './pages/admin/Integrations';
import { Couriers } from './pages/admin/Couriers';
import { Loyalty } from './pages/admin/Loyalty';
import { SuperAdmin } from './pages/SuperAdmin';
import { Checkout } from './pages/Checkout';
import { VirtualStore } from './pages/VirtualStore';
import { DevPanel } from './pages/DevPanel';
import { Users } from './pages/Users';
import { AccessDenied } from './pages/AccessDenied';
import { StockImport } from './pages/StockImport';
import { Complements } from './pages/Complements';
import { Team } from './pages/Team';
import { PaymentCheckout } from './pages/PaymentCheckout';

const ProtectedRoute = ({ children, allowedRoles, allowedPlans }: { children: React.ReactNode, allowedRoles?: string[], allowedPlans?: string[] }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.companyActive === false && location.pathname !== '/checkout') {
    if (user.role === 'gerencia') {
      return <Navigate to="/checkout" replace />;
    }
    return <AccessDenied />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  if (allowedPlans) {
    const plan = (user.plan || 'start').toLowerCase();
    const normalizedAllowed = allowedPlans.map(p => p.toLowerCase());
    
    // Convert generic basic/pro to handle annual/start
    let hasAccess = false;
    if (normalizedAllowed.includes('pro') && (plan === 'pro' || plan === 'annual')) hasAccess = true;
    if (normalizedAllowed.includes('basic') && (plan === 'basic' || plan === 'pro' || plan === 'annual')) hasAccess = true;
    if (normalizedAllowed.includes('start')) hasAccess = true; // start allows everything to fall through if start is allowed

    if (!hasAccess) {
      return <AccessDenied />; // Or redirect to a specific paywall page
    }
  }

  // Onboarding Guard: se for Admin e não tem staff, forçar ir para equipe
  // (a menos que já esteja na rota de equipe)
  if (user.role === 'gerencia' && user.hasStaff === false && location.pathname !== '/admin/equipe') {
    return <Navigate to="/admin/equipe" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        user ? (
          user.role === 'gerencia' ? ((user.plan || 'start').toLowerCase() === 'start' ? <Navigate to="/caixa" replace /> : <Navigate to="/admin" replace />) :
          user.role === 'caixa' ? <Navigate to="/caixa" replace /> :
          user.role === 'garcom' ? <Navigate to="/pedidos" replace /> :
          <Navigate to="/mesas" replace />
        ) : (
          <Landing />
        )
      } />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/saas-admin" element={<SuperAdmin />} />
      <Route path="/dev" element={<DevPanel />} />
      
      {/* Rota Pública do Cardápio Digital (Mesa) */}
      <Route path="/cardapio/:mesaId" element={<DigitalMenu />} />

      {/* Rota Pública da Loja Virtual (Delivery Próprio) */}
      <Route path="/loja/:tenantId" element={<VirtualStore />} />

      <Route 
        path="/pedidos" 
        element={
          <ProtectedRoute allowedRoles={['garcom', 'gerencia']} allowedPlans={['basic', 'pro']}>
            <WaiterDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/mesas" 
        element={
          <ProtectedRoute allowedRoles={['garcom', 'caixa', 'gerencia']} allowedPlans={['basic', 'pro']}>
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
        path="/caixa/pagamento/:orderId" 
        element={
          <ProtectedRoute allowedRoles={['caixa', 'gerencia']}>
            <PaymentCheckout />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/delivery" 
        element={
          <ProtectedRoute allowedRoles={['caixa', 'gerencia']} allowedPlans={['basic', 'pro']}>
            <Delivery />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Novas Rotas Administrativas */}
      <Route 
        path="/admin/financeiro" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Finance />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/produtos" 
        element={
          <ProtectedRoute allowedRoles={['gerencia', 'caixa']}>
            <Products />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/categorias" 
        element={
          <ProtectedRoute allowedRoles={['gerencia', 'caixa']}>
            <Categories />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/complementos" 
        element={
          <ProtectedRoute allowedRoles={['gerencia', 'caixa']}>
            <Complements />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/motoboys" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Couriers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/fidelidade" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Loyalty />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/crm" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Loyalty />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/integracoes" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Integrations />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/relatorios" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Reports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/estoque" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Inventory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/ingredientes" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Ingredients />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/estoque/importar" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <StockImport />
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
      <Route 
        path="/admin/delivery-settings" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['pro']}>
            <DeliverySettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/equipe" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Team />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/usuarios" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Users />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
