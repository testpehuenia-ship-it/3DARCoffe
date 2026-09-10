import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { CheckCircle, Clock, ChefHat, CheckSquare, Receipt, AlertCircle, Trash2, Edit } from 'lucide-react';

const OrderStatus = () => {
  const navigate = useNavigate();
  const { orders, activeOrderId, requestBill, clearActiveOrder, deleteOrder, loadOrderToCart } = useOrders();

  // Buscar el pedido activo en el listado de órdenes
  const activeOrder = orders.find(order => order.id === activeOrderId);

  if (!activeOrderId || !activeOrder) {
    return (
      <div className="container py-16 text-center animate-fade-in" style={{ padding: '0 1rem', marginTop: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', maxWidth: '400px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-accent)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', marginBottom: '1rem' }}>Sin Pedidos Activos</h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>No tienes ningún pedido activo en curso en este dispositivo en este momento.</p>
          <button 
            onClick={() => {
              clearActiveOrder();
              navigate('/menu');
            }} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 'bold' }}
          >
            Ver la Carta
          </button>
        </div>
      </div>
    );
  }

  const { id, customerName, items, total, status, billRequested } = activeOrder;

  // Manejar el cierre y limpieza del pedido una vez abonado
  const handleFinishedNewOrder = () => {
    clearActiveOrder();
    navigate('/menu');
  };

  const handleCancelOrder = async () => {
    if (window.confirm('¿Estás seguro de que deseas cancelar este pedido? Se eliminará definitivamente.')) {
      try {
        await deleteOrder(id);
        navigate('/menu');
      } catch (err) {
        alert('Error al cancelar el pedido. Por favor intenta de nuevo.');
      }
    }
  };

  const handleModifyOrder = async () => {
    if (window.confirm('¿Deseas modificar este pedido? Los productos volverán a tu carrito y se cancelará el pedido actual para que puedas hacer uno nuevo.')) {
      try {
        loadOrderToCart(items);
        await deleteOrder(id);
        navigate('/menu');
      } catch (err) {
        alert('Error al modificar el pedido. Por favor intenta de nuevo.');
      }
    }
  };

  // Si el pedido ya está finalizado (cajero registró el pago)
  if (status === 'finalizado') {
    return (
      <div className="container py-16 text-center animate-fade-in" style={{ padding: '0 1rem', marginTop: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '3rem 2rem', maxWidth: '450px', margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2f0d9' }}>
          <CheckCircle size={72} style={{ color: '#22c55e', margin: '0 auto 1.5rem auto' }} />
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>¡Pago Confirmado!</h1>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#385723', marginBottom: '1rem' }}>Muchas gracias, {customerName}.</p>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Esperamos que hayas disfrutado de tu café y postre en Patagonia. ¡Te deseamos un excelente día y esperamos volver a verte pronto! 🏔️☕🍦
          </p>
          <button 
            onClick={handleFinishedNewOrder} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}
          >
            Hacer un Nuevo Pedido
          </button>
        </div>
      </div>
    );
  }

  // Determinar index de progreso para el tracker de estados
  const getStatusStep = (statusStr) => {
    switch (statusStr) {
      case 'para_despachar': return 1;
      case 'visto_en_despacho': return 2;
      case 'despachado': return 3;
      default: return 1;
    }
  };

  const step = getStatusStep(status);

  return (
    <div className="container py-8 animate-fade-in" style={{ padding: '0 1rem', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* 1. Tracker de estado físico (solo se muestra si NO se ha pedido la cuenta) */}
      {!billRequested && (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '1rem' }}>
            Estado de tu pedido
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', margin: '1rem 0' }}>
            {/* Líneas conectoras de progreso */}
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: '35%', height: '3px', backgroundColor: '#e5e7eb', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', left: '10%', width: step === 2 ? '40%' : step === 3 ? '80%' : '0%', top: '35%', height: '3px', backgroundColor: 'var(--color-accent)', zIndex: 1, transition: 'all 0.5s ease' }}></div>

            {/* Paso 1: Recibido */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: step >= 1 ? 'var(--color-primary)' : '#e5e7eb', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: step >= 1 ? 'var(--color-primary)' : '#9ca3af' }}>Recibido</span>
            </div>

            {/* Paso 2: Preparando */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: step >= 2 ? 'var(--color-primary)' : '#e5e7eb', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s'
              }}>
                <ChefHat size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: step >= 2 ? 'var(--color-primary)' : '#9ca3af' }}>Preparando</span>
            </div>

            {/* Paso 3: Entregado */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: step >= 3 ? 'var(--color-primary)' : '#e5e7eb', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s'
              }}>
                <CheckSquare size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: step >= 3 ? 'var(--color-primary)' : '#9ca3af' }}>Despachado</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', padding: '0.5rem', borderRadius: '8px', backgroundColor: '#f9f6f0', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
            {step === 1 && "Estamos ingresando tu pedido a la cocina..."}
            {step === 2 && "¡Tu pedido se está preparando con cariño en barra!"}
            {step === 3 && "¡Tu pedido fue entregado en mesa! ¡Que lo disfrutes!"}
          </div>
        </div>
      )}

      {/* 2. Visualización del Ticket de Cobro / Cuenta (Thermal design) */}
      {billRequested ? (
        <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
          
          {/* Alerta de cobro en caja */}
          <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#b45309' }}>
            <AlertCircle size={24} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 'bold', margin: '0 0 0.125rem 0', fontSize: '0.9rem' }}>Cuenta Solicitada</p>
              <p style={{ margin: 0, fontSize: '0.825rem', lineHeight: '1.4' }}>
                Acércate a la caja e indica tu comanda **#{id.slice(-4)}** para abonar. Un camarero se encargará de validar el pago.
              </p>
            </div>
          </div>

          {/* Ticket Térmico Físico Digital */}
          <div style={{
            backgroundColor: '#faf8f5',
            borderRadius: '4px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e0dbd3',
            padding: '2.5rem 1.5rem 1.5rem 1.5rem',
            position: 'relative',
            fontFamily: 'monospace',
            color: '#1a1a1a'
          }}>
            {/* Efecto borde dentado arriba */}
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: 0,
              width: '100%',
              height: '12px',
              backgroundImage: 'radial-gradient(circle, transparent, transparent 50%, #faf8f5 50%, #faf8f5), radial-gradient(circle, #faf8f5, #faf8f5 50%, transparent 50%, transparent)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 6px 0',
              backgroundRepeat: 'repeat-x'
            }}></div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#111', fontFamily: 'monospace' }}>PATAGONIA</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>Cafetería & Heladería</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>Al pie de la cordillera</p>
              <div style={{ margin: '1rem 0', borderBottom: '1px dashed #999' }}></div>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>RECIBO DE CONSUMO</p>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>Comanda: <span style={{ fontWeight: 'bold' }}>#{id.slice(-4)}</span></p>
            </div>

            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <div>Cliente: <span style={{ fontWeight: 'bold' }}>{customerName}</span></div>
              <div>Fecha: {new Date(activeOrder.createdAt).toLocaleDateString()}</div>
              <div>Hora: {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>

            <div style={{ borderBottom: '1px dashed #999', marginBottom: '1rem' }}></div>

            {/* Listado de items del ticket */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ flex: 1, paddingRight: '0.5rem' }}>
                    {item.quantity} x {item.name}
                  </span>
                  <span style={{ flexShrink: 0 }}>
                    ${item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderBottom: '1px dashed #999', marginBottom: '1rem' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              <span>Total a Pagar</span>
              <span>${total}</span>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>¡GRACIAS POR TU VISITA!</p>
              <p style={{ margin: 0 }}>Patagonia premium coffee</p>
            </div>

            {/* Efecto borde dentado abajo */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: 0,
              width: '100%',
              height: '12px',
              backgroundImage: 'radial-gradient(circle, transparent, transparent 50%, #faf8f5 50%, #faf8f5), radial-gradient(circle, #faf8f5, #faf8f5 50%, transparent 50%, transparent)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 6px 0',
              backgroundRepeat: 'repeat-x',
              transform: 'rotate(180deg)'
            }}></div>

          </div>

        </div>
      ) : (
        /* Vista de Detalle y Botón Pedir Cuenta */
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <Receipt size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>Detalle de Consumo</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{item.quantity}x</span> {item.name}
                  </span>
                  <span style={{ fontWeight: '600' }}>
                    ${item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Total Consumido</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>${total}</span>
            </div>
          </div>

          {status === 'para_despachar' && (
            <div style={{ 
              backgroundColor: '#fff5f5', 
              border: '1px solid #fee2e2', 
              borderRadius: '16px', 
              padding: '1.25rem', 
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#991b1b', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>¿Necesitas cambiar algo?</h4>
              <p style={{ color: '#7f1d1d', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                Tu pedido aún no ha comenzado a prepararse. Puedes modificar los productos o cancelarlo por completo.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleModifyOrder}
                  style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    border: '1px solid #fca5a5',
                    color: '#b91c1c',
                    borderRadius: '10px',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <Edit size={14} /> Modificar
                </button>
                <button
                  onClick={handleCancelOrder}
                  style={{
                    flex: 1,
                    backgroundColor: '#b91c1c',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#991b1b'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                >
                  <Trash2 size={14} /> Cancelar Pedido
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => requestBill(id)}
              disabled={status === 'para_despachar'}
              style={{
                width: '100%',
                backgroundColor: status === 'para_despachar' ? '#d1d5db' : '#b45309', // Amber / Brown oscuro o gris
                color: status === 'para_despachar' ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: status === 'para_despachar' ? 'none' : '0 4px 12px rgba(180, 83, 9, 0.25)',
                cursor: status === 'para_despachar' ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (status !== 'para_despachar') {
                  e.currentTarget.style.backgroundColor = '#92400e';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'para_despachar') {
                  e.currentTarget.style.backgroundColor = '#b45309';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <Receipt size={20} /> Pedir la Cuenta
            </button>
            {status === 'para_despachar' ? (
              <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: '600' }}>
                No se puede solicitar la cuenta mientras el pedido esté pendiente de preparación.
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Al pedir la cuenta, generaremos tu ticket y avisaremos a caja.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderStatus;
