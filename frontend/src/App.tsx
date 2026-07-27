import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrinterProvider } from './context/PrinterContext';

const queryClient = new QueryClient();

const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const WaiterDashboard = lazy(() => import('./pages/WaiterDashboard').then(m => ({ default: m.WaiterDashboard })));
const CashierDashboard = lazy(() => import('./pages/CashierDashboard').then(m => ({ default: m.CashierDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PDV = lazy(() => import('./pages/PDV').then(m => ({ default: m.PDV })));
const Tables = lazy(() => import('./pages/Tables').then(m => ({ default: m.Tables })));

const Finance = lazy(() => import('./pages/Finance').then(m => ({ default: m.Finance })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.Categories })));
const Ingredients = lazy(() => import('./pages/Ingredients').then(m => ({ default: m.Ingredients })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Delivery = lazy(() => import('./pages/Delivery').then(m => ({ default: m.Delivery })));
const DigitalMenu = lazy(() => import('./pages/DigitalMenu').then(m => ({ default: m.DigitalMenu })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const DeliverySettings = lazy(() => import('./pages/admin/DeliverySettings').then(m => ({ default: m.DeliverySettings })));
const Integrations = lazy(() => import('./pages/admin/Integrations').then(m => ({ default: m.Integrations })));
const Couriers = lazy(() => import('./pages/admin/Couriers').then(m => ({ default: m.Couriers })));
const Loyalty = lazy(() => import('./pages/admin/Loyalty').then(m => ({ default: m.Loyalty })));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const VirtualStore = lazy(() => import('./pages/VirtualStore').then(m => ({ default: m.VirtualStore })));
const DevPanel = lazy(() => import('./pages/DevPanel').then(m => ({ default: m.DevPanel })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const AccessDenied = lazy(() => import('./pages/AccessDenied').then(m => ({ default: m.AccessDenied })));
const StockImport = lazy(() => import('./pages/StockImport').then(m => ({ default: m.StockImport })));
const Complements = lazy(() => import('./pages/Complements').then(m => ({ default: m.Complements })));
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })));
const PaymentCheckout = lazy(() => import('./pages/PaymentCheckout').then(m => ({ default: m.PaymentCheckout })));
const CRM = lazy(() => import('./pages/admin/CRM').then(m => ({ default: m.CRM })));
const Permissions = lazy(() => import('./pages/admin/Permissions').then(m => ({ default: m.Permissions })));

const ProtectedRoute = ({ children, allowedRoles, allowedPlans }: { children: React.ReactNode, allowedRoles?: string[], allowedPlans?: string[] }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.companyActive === false && location.pathname !== '/checkout') {
    if (user.role === 'gerencia') {
      return <Navigate to="/" replace />;
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
          user.companyActive === false ? <Navigate to="/checkout" replace /> :
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
            <CRM />
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
      <Route 
        path="/admin/permissoes" 
        element={
          <ProtectedRoute allowedRoles={['gerencia']} allowedPlans={['basic', 'pro']}>
            <Permissions />
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
        <PrinterProvider>
          <AuthProvider>
            <Router>
              <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                <AppRoutes />
              </Suspense>
            </Router>
          </AuthProvider>
        </PrinterProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
