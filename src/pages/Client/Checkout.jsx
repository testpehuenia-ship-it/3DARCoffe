import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, submitOrder, activeOrderId } = useOrders();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si ya hay un pedido activo en curso, redirigir directo a ver su estado
  useEffect(() => {
    if (activeOrderId) {
      navigate('/order-status');
    }
  }, [activeOrderId, navigate]);

  if (cart.length === 0) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-serif text-primary mb-4">Tu carrito está vacío</h2>
        <button onClick={() => navigate('/menu')} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px' }}>
          Volver a la carta
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    if (firstName.trim() && lastName.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await submitOrder(fullName);
        navigate('/order-status');
      } catch (err) {
        console.error('Error submitting order:', err);
        alert(err.message || 'Ocurrió un error al enviar tu pedido. Por favor, intenta de nuevo o avisa al personal de caja.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="container py-8 max-w-md mx-auto animate-fade-in" style={{ padding: '0 1rem', marginTop: '2rem' }}>
      <h1 className="text-2xl font-serif text-primary mb-6" style={{ textAlign: 'center', marginBottom: '2rem' }}>Confirmar Pedido</h1>
      
      <div className="card mb-8" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: '2rem' }}>
        <h2 className="text-lg font-medium border-b border-gray-100 pb-2 mb-4" style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Resumen de Consumo</h2>
        <div className="flex flex-col gap-3 mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span><span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{item.quantity}x</span> {item.name}</span>
              <span className="font-medium" style={{ fontWeight: '600' }}>${item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary)' }}>${cartTotal}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600', color: '#4b5563' }}>
          ¿A qué nombre tomamos el pedido? *
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>Nombre</label>
            <input 
              type="text" 
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: María"
              className="input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              autoFocus
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>Apellido</label>
            <input 
              type="text" 
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: Gómez"
              className="input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            onClick={() => navigate('/menu')}
            className="btn btn-outline"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold' }}
          >
            Volver
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 'bold', backgroundColor: 'var(--color-primary)', color: 'white', opacity: isSubmitting || !firstName.trim() || !lastName.trim() ? 0.7 : 1 }}
            disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
