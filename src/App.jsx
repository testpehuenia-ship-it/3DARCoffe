import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { OrderProvider, useOrders } from './context/OrderContext';
import Landing from './pages/Client/Landing';
import Menu from './pages/Client/Menu';
import Checkout from './pages/Client/Checkout';
import OrderStatus from './pages/Client/OrderStatus';
import Dashboard from './pages/Admin/Dashboard';
import QRViewer from './pages/Admin/QRViewer';
import './App.css';
import { Coffee } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const { activeOrderId } = useOrders();
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('patagonia_admin_authenticated') === 'true';
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAdminAuthenticated(sessionStorage.getItem('patagonia_admin_authenticated') === 'true');
    };
    window.addEventListener('admin-auth-change', handleAuthChange);
    return () => window.removeEventListener('admin-auth-change', handleAuthChange);
  }, []);

  const showAdminLinks = isAdminAuthenticated;

  // No mostramos la barra en el landing page
  if (location.pathname === '/') return null;

  return (
    <nav className="bg-primary text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-[1400px]">
        <Link to="/" className="flex items-center gap-2 text-xl font-serif font-bold text-accent hover:text-white transition-colors">
          <Coffee size={24} />
          <span>Patagonia</span>
        </Link>
        <div className="flex gap-4 text-sm font-medium items-center">
          <Link to="/menu" className="hover:text-accent transition-colors">Carta</Link>
          {activeOrderId && (
            <Link 
              to="/order-status" 
              className="hover:text-accent transition-colors"
              style={{ 
                backgroundColor: 'rgba(212, 163, 115, 0.2)', 
                color: 'var(--color-accent)',
                padding: '0.25rem 0.6rem', 
                borderRadius: '6px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Mi Pedido 🧾
            </Link>
          )}
          {showAdminLinks && (
            <>
              <Link to="/qr" className="hover:text-accent transition-colors">Código QR</Link>
              <Link to="/admin" className="hover:text-accent transition-colors bg-white/10 px-3 py-1 rounded">Caja Admin</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <OrderProvider>
      <BrowserRouter>
        <Navigation />
        <main className="min-h-screen bg-background">
          <Routes>
            {/* Rutas de Cliente */}
            <Route path="/" element={<Landing />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-status" element={<OrderStatus />} />
            
            {/* Rutas de Administrador */}
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/qr" element={<QRViewer />} />
          </Routes>
        </main>
      </BrowserRouter>
    </OrderProvider>
  );
}

export default App;
