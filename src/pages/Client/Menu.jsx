import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { ShoppingBag, Plus, Minus, ArrowRight, Box, Sparkles } from 'lucide-react';
import Product3DModal from '../../components/Product3DModal';

const Menu = () => {
  const navigate = useNavigate();
  const { menuItems, cart, addToCart, removeFromCart } = useOrders();
  const [selectedProduct3D, setSelectedProduct3D] = useState(null);

  const activeMenuItems = menuItems.filter(item => item.isActive);

  // Apertura automática si viene de escanear el QR (?product3d=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product3d');
    if (prodId && activeMenuItems.length > 0) {
      const found = activeMenuItems.find(p => p.id === prodId);
      if (found) setSelectedProduct3D(found);
    }
  }, [activeMenuItems]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getQuantity = (productId) => {
    const item = cart.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div style={{ 
      minHeight: '100dvh', 
      backgroundColor: '#fdf8f5', // Pastel claro cálido
      backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', // Patrón sutil, puedes cambiarlo a granos de café si consigues un link válido
      paddingBottom: '120px',
      position: 'relative'
    }}>
      
      {/* Header Premium */}
      <div style={{ 
        backgroundColor: 'var(--color-primary)', 
        padding: '2rem 1rem 3rem 1rem', 
        borderBottomLeftRadius: '40px', 
        borderBottomRightRadius: '40px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        backgroundImage: 'linear-gradient(rgba(44, 62, 45, 0.9), rgba(44, 62, 45, 0.9)), url("https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=1000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <h1 style={{ textAlign: 'center', color: 'white', fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-serif)' }}>Nuestra Carta</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-accent)', fontWeight: '500', margin: 0 }}>Selecciona tus productos favoritos</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
        {['cafeteria', 'heladeria', 'pasteleria'].map(category => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontFamily: 'var(--font-serif)', 
              color: 'var(--color-primary)', 
              textTransform: 'capitalize', 
              marginBottom: '1rem',
              paddingLeft: '0.5rem',
              borderLeft: '4px solid var(--color-accent)'
            }}>
              {category}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeMenuItems.filter(item => item.category === category).map(item => (
                <div key={item.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column', // Mobile-first: la imagen arriba o flex row ajustado
                  border: '1px solid #f0f0f0'
                }}>
                                {/* Layout Mobile: Imagen Izquierda, Texto Derecha, pero más ancho */}
                  <div style={{ display: 'flex', width: '100%' }}>
                    <div style={{ width: '40%', minHeight: '120px', position: 'relative' }}>
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      {item.hasAR && item.modelUrl && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct3D(item); }}
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            backgroundColor: 'rgba(20, 30, 21, 0.88)',
                            backdropFilter: 'blur(4px)',
                            color: '#D4A373',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            border: '1px solid rgba(212, 163, 115, 0.4)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            zIndex: 2
                          }}
                          title="Ver en 3D y Realidad Aumentada"
                        >
                          <Box size={12} />
                          <span>3D / AR</span>
                        </button>
                      )}
                    </div>
                    
                    <div style={{ width: '60%', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 0.25rem 0', lineHeight: '1.2' }}>{item.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 0.35rem 0', lineHeight: '1.4' }}>{item.description}</p>
                        
                        {item.hasAR && item.modelUrl && (
                          <button
                            onClick={() => setSelectedProduct3D(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: '#FAF5EE',
                              color: '#8B5A2B',
                              border: '1px solid #D4A373',
                              borderRadius: '8px',
                              padding: '3px 8px',
                              fontSize: '0.73rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              marginBottom: '0.4rem',
                              transition: 'background 0.2s'
                            }}
                          >
                            <Sparkles size={12} color="#D4A373" />
                            <span>Ver en tu mesa (3D/AR)</span>
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.2rem', margin: 0 }}>${item.price}</p>
                        
                        {getQuantity(item.id) === 0 ? (
                          <button 
                            onClick={() => addToCart(item)}
                            style={{ 
                              backgroundColor: 'var(--color-primary)', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '50%', 
                              width: '36px', 
                              height: '36px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={20} />
                          </button>
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            backgroundColor: '#f8f8f8', 
                            borderRadius: '20px', 
                            padding: '4px 8px',
                            border: '1px solid #eee'
                          }}>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', padding: '4px' }}
                            >
                              <Minus size={18} />
                            </button>
                            <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center', color: 'var(--color-primary)' }}>{getQuantity(item.id)}</span>
                            <button 
                              onClick={() => addToCart(item)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', padding: '4px' }}
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Cart */}
      {cartItemsCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '400px',
          backgroundColor: 'rgba(44, 62, 45, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          borderRadius: '20px',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 50,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '12px' }}>
                <ShoppingBag color="var(--color-accent)" size={24} />
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {cartItemsCount}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#ccc' }}>Total a pagar</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>${cartTotal}</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              Pedir <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal 3D y Realidad Aumentada */}
      {selectedProduct3D && (
        <Product3DModal
          product={selectedProduct3D}
          onClose={() => setSelectedProduct3D(null)}
          onAddToCart={(prod) => {
            const qty = prod.quantity || 1;
            for (let i = 0; i < qty; i++) {
              addToCart(prod);
            }
          }}
          currentQuantity={getQuantity(selectedProduct3D.id)}
        />
      )}
    </div>
  );
};

export default Menu;
