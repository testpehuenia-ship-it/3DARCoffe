import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCw, 
  Maximize2, 
  QrCode, 
  Plus, 
  Minus, 
  Check, 
  Camera, 
  Sparkles,
  Smartphone,
  Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Product3DModal({ product, onClose, onAddToCart, currentQuantity = 0 }) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [quantity, setQuantity] = useState(currentQuantity > 0 ? currentQuantity : 1);
  const modelViewerRef = useRef(null);

  // Cargar dinámicamente @google/model-viewer en el navegador
  useEffect(() => {
    import('@google/model-viewer').catch(err => {
      console.warn('Error cargando @google/model-viewer:', err);
    });
  }, []);

  // Eventos de carga del modelo
  useEffect(() => {
    const el = modelViewerRef.current;
    if (!el) return;

    const handleLoad = () => {
      setModelLoaded(true);
    };

    el.addEventListener('load', handleLoad);
    return () => {
      el.removeEventListener('load', handleLoad);
    };
  }, [product?.modelUrl]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  // Cálculo de dimensiones para la etiqueta de escala real 1:1
  const formatDimensions = (dim) => {
    if (!dim) return null;
    const w = Math.round((dim.width || 0.12) * 100);
    const h = Math.round((dim.height || 0.10) * 100);
    const d = Math.round((dim.depth || 0.12) * 100);
    return `${w} × ${h} × ${d} cm`;
  };

  const dimensionsLabel = formatDimensions(product.dimensions);

  // URL para el código QR (permite abrir directamente este producto en el móvil)
  const mobileArUrl = `${window.location.origin}/?product3d=${product.id}`;

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = '0deg 75deg 105%';
      modelViewerRef.current.cameraTarget = 'auto auto auto';
    }
  };

  const handleToggleAutoRotate = () => {
    if (modelViewerRef.current) {
      const next = !isAutoRotating;
      setIsAutoRotating(next);
      modelViewerRef.current.autoRotate = next;
    }
  };

  const handleAdd = () => {
    onAddToCart({ ...product, quantity });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 16, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(212, 163, 115, 0.25)',
          position: 'relative'
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0ede8',
          backgroundColor: '#FCFAF7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(44, 62, 45, 0.1)',
              color: 'var(--color-primary, #2C3E2D)',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Sparkles size={13} color="#D4A373" /> Visor 3D & AR
            </span>
            <span style={{ fontSize: '0.8rem', color: '#8c827a', textTransform: 'capitalize' }}>
              • {product.category}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar visor"
            style={{
              background: '#f2eee9',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#444',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Área del Visor 3D */}
        <div style={{ position: 'relative', width: '100%', height: '350px', backgroundColor: '#182219' }}>
          {/* Skeleton Loader mientras carga el modelo */}
          {!modelLoaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d4a373',
              gap: '0.75rem',
              zIndex: 2
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(212, 163, 115, 0.2)',
                borderTopColor: '#D4A373',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#eae4dc' }}>
                Cargando modelo 3D...
              </span>
            </div>
          )}

          {/* Web Component de Google Model Viewer */}
          <model-viewer
            ref={modelViewerRef}
            src={product.modelUrl}
            ios-src={product.iosModelUrl || undefined}
            alt={product.name}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            ar-placement="floor"
            camera-controls
            auto-rotate
            auto-rotate-delay="1000"
            rotation-per-second="20deg"
            shadow-intensity="1.5"
            shadow-softness="0.9"
            exposure="1.05"
            loading="eager"
            reveal="auto"
            style={{
              width: '100%',
              height: '100%',
              outline: 'none',
              '--poster-color': 'transparent'
            }}
          >
            {/* Botón oficial de AR colocado en el slot del componente */}
            <button
              slot="ar-button"
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2C3E2D',
                color: '#FFFFFF',
                border: '2px solid #D4A373',
                borderRadius: '999px',
                padding: '0.65rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                zIndex: 10,
                whiteSpace: 'nowrap'
              }}
            >
              <Camera size={18} color="#D4A373" />
              <span>Ver en mi mesa (AR)</span>
            </button>
          </model-viewer>

          {/* Botones de control flotantes sobre el visor 3D */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10
          }}>
            <button
              onClick={handleToggleAutoRotate}
              title={isAutoRotating ? 'Pausar rotación' : 'Activar rotación automática'}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                color: isAutoRotating ? '#2C3E2D' : '#888'
              }}
            >
              <RotateCw size={17} style={{ transform: isAutoRotating ? 'rotate(45deg)' : 'none' }} />
            </button>

            <button
              onClick={handleResetCamera}
              title="Centrar vista"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                color: '#2C3E2D'
              }}
            >
              <Maximize2 size={17} />
            </button>

            <button
              onClick={() => setShowQrCode(!showQrCode)}
              title="Abrir en celular con QR"
              style={{
                backgroundColor: showQrCode ? '#2C3E2D' : 'rgba(255, 255, 255, 0.85)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                color: showQrCode ? '#FFFFFF' : '#2C3E2D'
              }}
            >
              <QrCode size={17} />
            </button>
          </div>

          {/* Guía de interacción interactiva */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            color: '#FFFFFF',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '0.72rem',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Info size={12} color="#D4A373" />
            <span>Arrastra para girar 360° • Pellizca para zoom</span>
          </div>

          {/* Modal / Overlay de Código QR para usuarios de Desktop */}
          {showQrCode && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(20, 28, 21, 0.95)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              textAlign: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                marginBottom: '1rem'
              }}>
                <QRCodeSVG value={mobileArUrl} size={150} fgColor="#2C3E2D" />
              </div>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', margin: '0 0 0.25rem 0', fontFamily: 'var(--font-serif)' }}>
                Escanea con tu celular
              </h4>
              <p style={{ color: '#d4c7b8', fontSize: '0.8rem', maxWidth: '280px', margin: '0 0 1rem 0' }}>
                Apunta la cámara de tu móvil a este código para proyectar este plato en tu mesa en Realidad Aumentada.
              </p>
              <button
                onClick={() => setShowQrCode(false)}
                style={{
                  backgroundColor: '#D4A373',
                  color: '#1a241b',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.4rem 1.2rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Volver al 3D
              </button>
            </div>
          )}
        </div>

        {/* Información y Acciones del Producto */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{
                fontSize: '1.4rem',
                color: 'var(--color-primary, #2C3E2D)',
                margin: 0,
                fontFamily: 'var(--font-serif)'
              }}>
                {product.name}
              </h2>
              <span style={{
                fontSize: '1.35rem',
                fontWeight: 'bold',
                color: 'var(--color-primary, #2C3E2D)'
              }}>
                ${product.price}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#666', margin: '0.35rem 0 0 0', lineHeight: 1.45 }}>
              {product.description}
            </p>
          </div>

          {/* Botón Principal de Realidad Aumentada */}
          <button
            onClick={() => {
              if (modelViewerRef.current && modelViewerRef.current.canActivateAR) {
                modelViewerRef.current.activateAR();
              } else {
                setShowQrCode(true);
              }
            }}
            style={{
              backgroundColor: '#2C3E2D',
              color: '#FFFFFF',
              border: '2px solid #D4A373',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 14px rgba(44, 62, 45, 0.25)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Camera size={20} color="#D4A373" />
            <span>Ver en mi mesa (Realidad Aumentada)</span>
          </button>

          {/* Banner informativo de Escala Real 1:1 en Realidad Aumentada */}
          <div style={{
            backgroundColor: '#F9F5F0',
            border: '1px solid #EBE4DA',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <div style={{
              backgroundColor: '#2C3E2D',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex'
            }}>
              <Smartphone size={16} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4a443e', lineHeight: 1.35 }}>
              {dimensionsLabel ? (
                <>
                  <strong style={{ color: '#2C3E2D' }}>Tamaño real: {dimensionsLabel}</strong>
                  <div>Al proyectar en tu mesa, se visualizará con estas medidas exactas (escala 1:1).</div>
                </>
              ) : (
                <>
                  <strong style={{ color: '#2C3E2D' }}>Realidad Aumentada 1:1</strong>
                  <div>Proyecta este plato directamente en tu mesa para ver su proporción exacta.</div>
                </>
              )}
            </div>
          </div>

          {/* Selector de cantidad y Botón Agregar al Carrito */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingTop: '0.25rem'
          }}>
            {/* Control de cantidad */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F4EFEB',
              borderRadius: '999px',
              padding: '0.25rem'
            }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#2C3E2D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <Minus size={15} />
              </button>
              <span style={{
                width: '36px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: '#2C3E2D'
              }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#2C3E2D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Botón Añadir al Pedido */}
            <button
              onClick={handleAdd}
              style={{
                flex: 1,
                backgroundColor: addedAnimation ? '#238636' : 'var(--color-primary, #2C3E2D)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                padding: '0.85rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 14px rgba(44, 62, 45, 0.25)'
              }}
            >
              {addedAnimation ? (
                <>
                  <Check size={18} />
                  <span>¡Agregado al pedido!</span>
                </>
              ) : (
                <>
                  <span>Agregar al Pedido • ${(product.price * quantity).toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe styles locales */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
