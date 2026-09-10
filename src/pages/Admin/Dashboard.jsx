import React, { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';
import { db, isFirebaseConfigured } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Clock, 
  ChefHat, 
  CheckSquare, 
  CheckCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Receipt, 
  DollarSign, 
  Lock, 
  LogOut,
  BarChart2,
  Calendar,
  FileText,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';

const PRODUCT_COLORS = [
  '#4e79a7', // Muted Blue
  '#f28e2b', // Soft Orange
  '#e15759', // Muted Red
  '#76b7b2', // Teal
  '#59a14f', // Soft Green
  '#edc948', // Soft Yellow
  '#b07aa1', // Lavender
  '#ff9da7', // Soft Pink
  '#9c755f', // Muted Brown
  '#bab0ac', // Light Gray
  '#2C3E2D', // Forest Green
  '#8B5A2B', // Warm Wood
  '#D4A373', // Light Wood / Sand
  '#ccd5ae', // Olive
  '#e8a598', // Soft Terracotta
  '#809bce', // Periwinkle
  '#b8e0d2', // Soft Mint
  '#f7d6e0', // Pale Rose
  '#b3cde3'  // Pastel Muted Ice Blue
];

const getProductColor = (productName) => {
  if (!productName) return '#9ca3af';
  let hash = 0;
  for (let i = 0; i < productName.length; i++) {
    hash = productName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRODUCT_COLORS.length;
  return PRODUCT_COLORS[index];
};

const renderProductChart = (products, chartType, maxQty) => {
  if (products.length === 0) return null;

  if (chartType === 'horizontal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {products.map((prod, idx) => {
          const percentage = Math.round((prod.qty / maxQty) * 100);
          const color = getProductColor(prod.name);
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.45rem', alignItems: 'center' }}>
                <span style={{ color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                  {prod.name}
                </span>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{prod.qty} u.</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: '100%', 
                  backgroundColor: color, 
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (chartType === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-around', 
          height: '220px', 
          padding: '1rem 0.5rem 0.5rem 0.5rem', 
          borderBottom: '1px solid #e5e7eb',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {products.map((prod, idx) => {
            const percentage = Math.round((prod.qty / maxQty) * 100);
            const color = getProductColor(prod.name);
            return (
              <div 
                key={idx} 
                style={{ 
                  flex: '1 1 0%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  height: '100%', 
                  justifyContent: 'flex-end', 
                  minWidth: '45px',
                  maxWidth: '70px'
                }} 
                title={`${prod.name}: ${prod.qty} unidades`}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '4px', fontFamily: 'monospace' }}>
                  {prod.qty}
                </span>
                <div style={{
                  width: '70%',
                  height: `${Math.max(percentage, 5)}%`,
                  backgroundColor: color,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: '0.5rem' }}>
          {products.map((prod, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#4b5563' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getProductColor(prod.name) }} />
              <span style={{ fontWeight: '500' }}>{prod.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chartType === 'donut') {
    const totalQty = products.reduce((sum, p) => sum + p.qty, 0);
    let accumulatedPercent = 0;
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexWrap: 'wrap', 
        gap: '2rem', 
        padding: '0.5rem 0' 
      }}>
        <div style={{ width: '150px', height: '150px', transform: 'rotate(-90deg)', flexShrink: 0, position: 'relative' }}>
          <svg viewBox="0 0 42 42" width="100%" height="100%">
            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f3f4f6" strokeWidth="6" />
            
            {products.map((prod, idx) => {
              const sharePercent = (prod.qty / totalQty) * 100;
              const color = getProductColor(prod.name);
              const offset = 100 - accumulatedPercent;
              accumulatedPercent += sharePercent;
              return (
                <circle
                  key={idx}
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="6"
                  strokeDasharray={`${sharePercent} ${100 - sharePercent}`}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
                />
              );
            })}
            
            <circle cx="21" cy="21" r="12" fill="#ffffff" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }} />
          </svg>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            transform: 'rotate(90deg)'
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace', lineHeight: '1' }}>{totalQty}</span>
            <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 'bold', marginTop: '2px', letterSpacing: '0.5px' }}>TOTAL</span>
          </div>
        </div>

        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
          {products.map((prod, idx) => {
            const sharePercent = Math.round((prod.qty / totalQty) * 100);
            const color = getProductColor(prod.name);
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                  {prod.name}
                </span>
                <span style={{ fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>
                  {prod.qty} u. ({sharePercent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (chartType === 'bubbles') {
    const minSize = 65;
    const maxSize = 115;
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '1rem 0',
        minHeight: '200px'
      }}>
        {products.map((prod, idx) => {
          const color = getProductColor(prod.name);
          const size = products.length === 1 
            ? maxSize 
            : minSize + ((prod.qty / maxQty) * (maxSize - minSize));
          return (
            <div
              key={idx}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                backgroundColor: color,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
              }}
              title={`${prod.name}: ${prod.qty} u.`}
            >
              <span style={{ 
                fontSize: size < 80 ? '0.65rem' : '0.75rem', 
                fontWeight: 'bold', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical', 
                width: '100%', 
                lineHeight: '1.1',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {prod.name}
              </span>
              <span style={{ 
                fontSize: size < 80 ? '0.8rem' : '1rem', 
                fontWeight: '800', 
                marginTop: '3px', 
                fontFamily: 'monospace',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {prod.qty}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

const Dashboard = () => {
  const { 
    orders, 
    updateOrderStatus, 
    requestBill,
    menuItems, 
    addMenuItem, 
    updateMenuItem, 
    toggleMenuItemActive, 
    deleteMenuItem,
    closings = [],
    saveClosing
  } = useOrders();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('patagonia_admin_authenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password management states
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('patagonia_admin_password') || 'patagonia2026';
  });
  
  // Password Recovery States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Password Change States (Security Tab)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordTab, setNewPasswordTab] = useState('');
  const [confirmNewPasswordTab, setConfirmNewPasswordTab] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Load password from Firestore on mount
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const fetchPassword = async () => {
        try {
          const docRef = doc(db, 'settings', 'security');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().password) {
            setAdminPassword(docSnap.data().password);
            localStorage.setItem('patagonia_admin_password', docSnap.data().password);
          }
        } catch (e) {
          console.error("Error al obtener la contraseña desde Firestore:", e);
        }
      };
      fetchPassword();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('patagonia_admin_authenticated', 'true');
      setLoginError('');
      window.dispatchEvent(new Event('admin-auth-change'));
    } else {
      setLoginError('Usuario o clave incorrectos.');
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (recoveryKey.trim() !== 'PATAGONIA_RECOVERY') {
      setRecoveryError('La clave de recuperación maestra es incorrecta.');
      return;
    }
    if (newPassword.length < 4) {
      setRecoveryError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Las contraseñas no coinciden.');
      return;
    }

    try {
      // Guardar localmente
      localStorage.setItem('patagonia_admin_password', newPassword);
      setAdminPassword(newPassword);

      // Guardar en Firestore
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'settings', 'security'), { password: newPassword });
      }

      // Autenticar de inmediato
      setIsAuthenticated(true);
      sessionStorage.setItem('patagonia_admin_authenticated', 'true');
      window.dispatchEvent(new Event('admin-auth-change'));
      
      // Limpiar estados de recuperación
      setIsRecovering(false);
      setRecoveryKey('');
      setNewPassword('');
      setConfirmNewPassword('');
      setRecoveryError('');
    } catch (err) {
      console.error("Error al restablecer la contraseña:", err);
      setRecoveryError('Ocurrió un error al guardar la nueva contraseña.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (currentPassword !== adminPassword) {
      setChangePasswordError('La contraseña actual es incorrecta.');
      setChangePasswordSuccess('');
      return;
    }
    if (newPasswordTab.length < 4) {
      setChangePasswordError('La nueva contraseña debe tener al menos 4 caracteres.');
      setChangePasswordSuccess('');
      return;
    }
    if (newPasswordTab !== confirmNewPasswordTab) {
      setChangePasswordError('La nueva contraseña y la confirmación no coinciden.');
      setChangePasswordSuccess('');
      return;
    }

    try {
      // Guardar localmente
      localStorage.setItem('patagonia_admin_password', newPasswordTab);
      setAdminPassword(newPasswordTab);

      // Guardar en Firestore
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'settings', 'security'), { password: newPasswordTab });
      }

      setChangePasswordSuccess('¡Contraseña cambiada con éxito!');
      setChangePasswordError('');
      
      // Limpiar campos
      setCurrentPassword('');
      setNewPasswordTab('');
      setConfirmNewPasswordTab('');
    } catch (err) {
      console.error("Error al cambiar la contraseña:", err);
      setChangePasswordError('Ocurrió un error al guardar la nueva contraseña.');
      setChangePasswordSuccess('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('patagonia_admin_authenticated');
    window.dispatchEvent(new Event('admin-auth-change'));
  };

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'history' o 'reports'
  
  // Reports State
  const [reportsSubTab, setReportsSubTab] = useState('daily'); // 'daily', 'monthly', 'yearly', 'history'
  
  // Get current date/month/year in local time safely
  const getLocalDateString = (dateInput = new Date()) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!date || isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [selectedDailyDate, setSelectedDailyDate] = useState(() => getLocalDateString());
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalDateString().substring(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [dailyChartType, setDailyChartType] = useState('horizontal'); // 'horizontal', 'vertical', 'donut', 'bubbles'
  const [monthlyChartType, setMonthlyChartType] = useState('horizontal'); // 'horizontal', 'vertical', 'donut', 'bubbles'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'cafeteria',
    image: '',
    hasAR: true,
    modelUrl: '/models/teacup.glb',
    widthCm: '12',
    heightCm: '8',
    depthCm: '12'
  });

  const getOrdersByStatus = (status) => orders.filter(order => order.status === status);

  const columns = [
    { 
      id: 'para_despachar', 
      title: 'Para Despachar', 
      icon: <Clock size={20} style={{ color: '#f97316' }} />,
      nextStatus: 'visto_en_despacho',
      btnText: 'Preparar'
    },
    { 
      id: 'visto_en_despacho', 
      title: 'Visto en Despacho', 
      icon: <ChefHat size={20} style={{ color: '#3b82f6' }} />,
      nextStatus: 'entregado',
      btnText: 'Entregar'
    },
    { 
      id: 'entregado', 
      title: 'Entregado', 
      icon: <CheckSquare size={20} style={{ color: '#10b981' }} />,
      nextStatus: 'cuenta_pedida',
      btnText: 'Pedir Cuenta'
    },
    { 
      id: 'cuenta_pedida', 
      title: 'Cuenta Pedida', 
      icon: <Receipt size={20} style={{ color: '#ec4899' }} />,
      nextStatus: 'cerrado',
      btnText: 'Cobrar'
    }
  ];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: 'cafeteria', 
      image: '',
      hasAR: true,
      modelUrl: '/models/teacup.glb',
      widthCm: '12',
      heightCm: '8',
      depthCm: '12'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingProduct(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image || '',
      hasAR: item.hasAR !== undefined ? Boolean(item.hasAR) : false,
      modelUrl: item.modelUrl || '',
      widthCm: item.dimensions?.width ? String(Math.round(item.dimensions.width * 100)) : '12',
      heightCm: item.dimensions?.height ? String(Math.round(item.dimensions.height * 100)) : '8',
      depthCm: item.dimensions?.depth ? String(Math.round(item.dimensions.depth * 100)) : '12'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Por favor, ingresa un nombre y un precio válidos.');
      return;
    }

    let finalImage = formData.image.trim();
    if (!finalImage) {
      // Defaults de Unsplash si no se define imagen
      if (formData.category === 'cafeteria') {
        finalImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80';
      } else if (formData.category === 'heladeria') {
        finalImage = 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&q=80';
      } else {
        finalImage = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80';
      }
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      price: Number(formData.price),
      image: finalImage,
      hasAR: Boolean(formData.hasAR),
      modelUrl: formData.hasAR ? (formData.modelUrl?.trim() || null) : null,
      dimensions: formData.hasAR ? {
        width: (Number(formData.widthCm) || 12) / 100,
        height: (Number(formData.heightCm) || 8) / 100,
        depth: (Number(formData.depthCm) || 12) / 100
      } : null
    };

    if (editingProduct) {
      updateMenuItem({
        ...editingProduct,
        ...payload
      });
    } else {
      addMenuItem({
        ...payload
      });
    }

    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: 'cafeteria', 
      image: '',
      hasAR: true,
      modelUrl: '/models/teacup.glb',
      widthCm: '12',
      heightCm: '8',
      depthCm: '12'
    });
  };

  const handleDelete = (itemId, name) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${name}"?`)) {
      deleteMenuItem(itemId);
    }
  };

  const activeOrdersCount = getOrdersByStatus('para_despachar').length + 
                           getOrdersByStatus('visto_en_despacho').length + 
                           getOrdersByStatus('despachado').length;

  if (!isAuthenticated) {
    if (isRecovering) {
      return (
        <div style={{
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-sans)',
          padding: '2rem 1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            border: '1px solid #e5e0d8',
            padding: '3rem 2rem',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 8px 16px rgba(44, 62, 45, 0.15)'
            }}>
              <Lock size={28} />
            </div>

            <h2 style={{
              fontSize: '1.6rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-primary)',
              margin: '0 0 0.5rem 0'
            }}>
              Restablecer Clave
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '0.85rem',
              margin: '0 0 2rem 0'
            }}>
              Ingresa la Clave Maestra de Recuperación para definir una nueva clave.
            </p>

            <form onSubmit={handleRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {recoveryError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textAlign: 'left'
                }}>
                  {recoveryError}
                </div>
              )}

              <div style={{ textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#4b5563',
                  marginBottom: '0.375rem'
                }}>
                  Clave Maestra de Recuperación
                </label>
                <input
                  type="password"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  placeholder="Clave maestra"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#4b5563',
                  marginBottom: '0.375rem'
                }}>
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#4b5563',
                  marginBottom: '0.375rem'
                }}>
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    outline: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '0.5rem',
                  boxShadow: '0 4px 10px rgba(44, 62, 45, 0.15)'
                }}
              >
                Restablecer e Iniciar Sesión 🔑
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRecovering(false);
                  setRecoveryError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                Volver al Login
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
          border: '1px solid #e5e0d8',
          padding: '3rem 2rem',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 8px 16px rgba(44, 62, 45, 0.15)'
          }}>
            <Lock size={28} />
          </div>

          <h2 style={{
            fontSize: '1.6rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--color-primary)',
            margin: '0 0 0.5rem 0'
          }}>
            Acceso de Caja
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '0.85rem',
            margin: '0 0 2rem 0'
          }}>
            Ingresa tus credenciales para administrar comandas y carta.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {loginError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>
                {loginError}
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4b5563',
                marginBottom: '0.375rem'
              }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4b5563',
                marginBottom: '0.375rem'
              }}>
                Clave de Seguridad
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '0.5rem',
                boxShadow: '0 4px 10px rgba(44, 62, 45, 0.15)'
              }}
            >
              Iniciar Sesión 🔓
            </button>
          </form>

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => {
                setIsRecovering(true);
                setLoginError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.9rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ¿Olvidaste tu contraseña? 🔑
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            Usuario: <strong>admin</strong> | Clave: <strong>{adminPassword}</strong>
          </div>
        </div>
      </div>
    );
  }

  const finalizedOrders = orders.filter(o => o.status === 'finalizado');
  const totalRevenue = finalizedOrders.reduce((sum, o) => sum + o.total, 0);

  // --- Daily reports computations ---
  const dailyOrders = orders.filter(o => 
    o.status === 'finalizado' && 
    o.createdAt && 
    getLocalDateString(o.createdAt) === selectedDailyDate
  );
  
  const dailyTotalSales = dailyOrders.reduce((sum, o) => sum + o.total, 0);
  const dailyOrdersCount = dailyOrders.length;
  const dailyAverageTicket = dailyOrdersCount > 0 ? Math.round(dailyTotalSales / dailyOrdersCount) : 0;
  
  // Products sold today
  const dailyProductQuantities = {};
  dailyOrders.forEach(order => {
    order.items.forEach(item => {
      if (dailyProductQuantities[item.name]) {
        dailyProductQuantities[item.name] += item.quantity;
      } else {
        dailyProductQuantities[item.name] = item.quantity;
      }
    });
  });
  
  const sortedDailyProducts = Object.entries(dailyProductQuantities)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  const maxDailyQty = sortedDailyProducts.length > 0 ? sortedDailyProducts[0].qty : 1;

  // --- Monthly reports computations ---
  // List of closures for the selected month
  const monthlyClosings = closings.filter(c => c.date && c.date.startsWith(selectedMonth));
  
  // Realized orders for the selected month (for comparison/live stats)
  const monthlyOrders = orders.filter(o => 
    o.status === 'finalizado' && 
    o.createdAt && 
    getLocalDateString(o.createdAt).startsWith(selectedMonth)
  );
  
  const monthlyTotalSales = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
  const monthlyOrdersCount = monthlyOrders.length;
  const monthlyAverageTicket = monthlyOrdersCount > 0 ? Math.round(monthlyTotalSales / monthlyOrdersCount) : 0;
  
  // Products sold this month
  const monthlyProductQuantities = {};
  monthlyOrders.forEach(order => {
    order.items.forEach(item => {
      if (monthlyProductQuantities[item.name]) {
        monthlyProductQuantities[item.name] += item.quantity;
      } else {
        monthlyProductQuantities[item.name] = item.quantity;
      }
    });
  });
  
  const sortedMonthlyProducts = Object.entries(monthlyProductQuantities)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  const maxMonthlyQty = sortedMonthlyProducts.length > 0 ? sortedMonthlyProducts[0].qty : 1;

  // --- Yearly reports computations ---
  const yearlyOrders = orders.filter(o => 
    o.status === 'finalizado' && 
    o.createdAt && 
    getLocalDateString(o.createdAt).startsWith(String(selectedYear))
  );
  
  const yearlyTotalSales = yearlyOrders.reduce((sum, o) => sum + o.total, 0);
  const yearlyOrdersCount = yearlyOrders.length;
  
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  const yearlyMonthsData = Array.from({ length: 12 }, (_, i) => {
    const monthStr = String(i + 1).padStart(2, '0');
    const monthPrefix = `${selectedYear}-${monthStr}`;
    const monthOrders = yearlyOrders.filter(o => getLocalDateString(o.createdAt).startsWith(monthPrefix));
    const sales = monthOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      name: monthNames[i],
      sales,
      count: monthOrders.length
    };
  });
  
  const maxYearlyMonthSales = Math.max(...yearlyMonthsData.map(m => m.sales), 1);

  const handlePerformDailyClosing = () => {
    const closingId = `closing_${selectedDailyDate}`;
    const alreadyClosed = closings.some(c => c.id === closingId);
    
    if (alreadyClosed) {
      if (!window.confirm(`Ya existe un cierre registrado para el día ${selectedDailyDate}. ¿Deseas sobreescribirlo con los datos actuales?`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Confirmas que deseas realizar el cierre de caja para el día ${selectedDailyDate}?`)) {
        return;
      }
    }
    
    saveClosing({
      id: closingId,
      date: selectedDailyDate,
      totalSales: dailyTotalSales,
      ordersCount: dailyOrdersCount,
      averageTicket: dailyAverageTicket,
      popularItems: sortedDailyProducts
    });
    
    alert(`¡Cierre de caja guardado con éxito para el día ${selectedDailyDate}!`);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* CSS interno temporal para animar el pulso de la cuenta solicitada */}
      <style>{`
        @keyframes borderPulse {
          0% { border-color: #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          50% { border-color: #d97706; box-shadow: 0 0 12px rgba(217, 119, 6, 0.4); }
          100% { border-color: #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        }
        @keyframes textPulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        .order-card-pulse {
          animation: borderPulse 2s infinite ease-in-out;
        }
        .badge-pulse {
          animation: textPulse 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* Header Premium */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', margin: 0 }}>Caja y Despacho</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Panel de administración de la cafetería</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            fontSize: '0.875rem', 
            backgroundColor: isFirebaseConfigured ? '#e2f0d9' : '#fef3c7', 
            color: isFirebaseConfigured ? '#385723' : '#b45309', 
            padding: '0.375rem 1rem', 
            borderRadius: '9999px',
            fontWeight: '500',
            border: isFirebaseConfigured ? '1px solid #c5e0b4' : '1px solid #fde68a'
          }}>
            {isFirebaseConfigured ? '🟢 Nube Activa' : '⚠️ Modo Local'}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            padding: '0.375rem 1rem', 
            borderRadius: '9999px',
            fontWeight: '500'
          }}>
            {orders.length} pedidos registrados
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '0.375rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            title="Cerrar Sesión"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem', 
        borderBottom: '2px solid #e5e7eb', 
        paddingBottom: '0.25rem',
        overflowX: 'auto'
      }}>
        <button 
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'orders' ? 'var(--color-primary)' : '#6b7280',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Comandas ({activeOrdersCount} activas)
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'menu' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'menu' ? 'var(--color-primary)' : '#6b7280',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Gestionar Carta ({menuItems.length} productos)
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'history' ? 'var(--color-primary)' : '#6b7280',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Historial de Caja ({finalizedOrders.length} cobros)
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'reports' ? 'var(--color-primary)' : '#6b7280',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Reportes y Cierre 📊
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'security' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'security' ? 'var(--color-primary)' : '#6b7280',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Seguridad 🔑
        </button>
      </div>

      {/* Contenido de la pestaña de COMANDAS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem' }}>
          {columns.map(column => {
            const colOrders = getOrdersByStatus(column.id);
            return (
              <div 
                key={column.id} 
                style={{ 
                  flex: '1 1 300px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '16px', 
                  padding: '1.25rem', 
                  minHeight: '600px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  {column.icon}
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{column.title}</h2>
                  <span style={{ marginLeft: 'auto', backgroundColor: '#e5e7eb', color: '#4b5563', fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontWeight: '600' }}>
                    {colOrders.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {colOrders.map(order => (
                    <div 
                      key={order.id} 
                      className={order.billRequested ? "order-card-pulse" : ""}
                      style={{ 
                        backgroundColor: order.billRequested ? '#fffdf5' : 'white', 
                        borderRadius: '12px', 
                        padding: '1.25rem', 
                        border: order.billRequested ? '2px solid #d97706' : '1px solid #e5e7eb', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s'
                      }}
                    >
                      {/* Badge parpadeante de cuenta solicitada */}
                      {order.billRequested && (
                        <div 
                          className="badge-pulse"
                          style={{
                            alignSelf: 'flex-start',
                            backgroundColor: '#d97706',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Receipt size={12} /> CUENTA SOLICITADA
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>{order.customerName}</h3>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>#{order.id.slice(-4)}</span>
                      </div>
                      
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                        {order.items.map((item, idx) => (
                          <li key={idx} style={{ padding: '0.375rem 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #f3f4f6' }}>
                            <span>
                              <span style={{ fontWeight: 'bold', color: 'var(--color-accent)', marginRight: '0.5rem' }}>{item.quantity}x</span> 
                              {item.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.1rem' }}>${order.total}</span>
                        
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {order.billRequested ? (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Registrar cobro del pedido de ${order.customerName} por $${order.total}?`)) {
                                  updateOrderStatus(order.id, 'finalizado');
                                }
                              }}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                            >
                              Cobrar 💵
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Solicitar cierre/cuenta para el pedido de ${order.customerName}?`)) {
                                  requestBill(order.id);
                                }
                              }}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#d97706',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b45309'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                            >
                              Solicitar Cuenta 🧾
                            </button>
                          )}
                          
                          {column.nextStatus && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, column.nextStatus)}
                              style={{ 
                                padding: '0.375rem 0.75rem', 
                                backgroundColor: 'var(--color-primary)', 
                                color: 'white', 
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                            >
                              {column.btnText}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {colOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                      No hay pedidos en cola
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contenido de la pestaña de GESTIÓN DE PRODUCTOS */}
      {activeTab === 'menu' && (
        <div>
          {/* Subheader con botón */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', margin: 0 }}>Carta del Establecimiento</h2>
            <button 
              onClick={handleOpenAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.625rem 1.25rem',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <Plus size={18} /> Cargar Producto
            </button>
          </div>

          {/* Grilla de productos */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {menuItems.map(item => (
              <div 
                key={item.id} 
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '14px', 
                  border: '1px solid #e5e7eb', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  opacity: item.isActive ? 1 : 0.65,
                  transition: 'opacity 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f3f4f6' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: '#f3f4f6', 
                        color: '#4b5563', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '6px',
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}>
                        {item.category}
                      </span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        ${item.price}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0.375rem 0 0.125rem 0', color: '#111827' }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Acciones en la tarjeta */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderTop: '1px solid #f3f4f6', 
                  paddingTop: '0.75rem',
                  marginTop: 'auto'
                }}>
                  {/* Botón de Alta / Baja */}
                  <button
                    onClick={() => toggleMenuItemActive(item.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: item.isActive ? '#e2f0d9' : '#fee2e2',
                      color: item.isActive ? '#385723' : '#991b1b',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.isActive ? (
                      <>
                        <Eye size={14} /> Visible (Alta)
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} /> Oculto (Baja)
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        color: '#4b5563',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.color = '#4b5563';
                      }}
                      title="Modificar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        border: '1px solid #fee2e2',
                        borderRadius: '8px',
                        backgroundColor: '#fff5f5',
                        color: '#dc2626',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff5f5';
                      }}
                      title="Eliminar permanentemente"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {menuItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '16px', backgroundColor: '#f9fafb' }}>
              No hay productos registrados en la carta.
            </div>
          )}
        </div>
      )}

      {/* Contenido de la pestaña de HISTORIAL DE VENTAS */}
      {activeTab === 'history' && (
        <div>
          {/* Tarjeta de Resumen */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            backgroundColor: '#e2f0d9', 
            padding: '1.5rem', 
            borderRadius: '16px', 
            marginBottom: '2rem', 
            border: '1px solid #c8e2b8', 
            color: '#2c5e1b' 
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#274e13', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={20} /> Recaudación de Caja
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#385723' }}>Ingresos totales por comandas abonadas</p>
            </div>
            <span style={{ fontSize: '2.25rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
              ${totalRevenue}
            </span>
          </div>

          {/* Listado de cobros completados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {finalizedOrders.map(order => (
              <div 
                key={order.id} 
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '14px', 
                  padding: '1.25rem', 
                  border: '1px solid #e5e7eb', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>{order.customerName}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>#{order.id.slice(-4)}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                    Cobrado el {new Date(order.createdAt).toLocaleDateString()} a las {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {order.items.map((item, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: '#f3f4f6', 
                          color: '#4b5563', 
                          padding: '0.125rem 0.5rem', 
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}
                      >
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>${order.total}</span>
                  <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                    <CheckCircle size={12} /> COBRADO
                  </div>
                </div>
              </div>
            ))}

            {finalizedOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '16px', backgroundColor: '#f9fafb' }}>
                Aún no hay cobros registrados en el historial de hoy.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido de la pestaña de REPORTES Y CIERRES */}
      {activeTab === 'reports' && (
        <div className="animate-fade-in">
          {/* Sub-Navegación de Reportes */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            backgroundColor: 'white',
            padding: '0.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            border: '1px solid #e5e7eb',
            overflowX: 'auto'
          }}>
            {[
              { id: 'daily', label: 'Cierre Diario ☀️' },
              { id: 'monthly', label: 'Cierre Mensual 🌙' },
              { id: 'yearly', label: 'Cierre Anual 🏔️' },
              { id: 'history', label: 'Historial de Cierres 📁' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setReportsSubTab(tab.id)}
                style={{
                  flex: '1 1 auto',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: reportsSubTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  color: reportsSubTab === tab.id ? 'white' : '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENIDO DAILY */}
          {reportsSubTab === 'daily' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Selector de Fecha */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '1rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-primary)' }} /> Seleccionar Día de Análisis
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Consulta las ventas y realiza el cierre formal de caja para la fecha seleccionada.
                  </p>
                </div>
                <input
                  type="date"
                  value={selectedDailyDate}
                  onChange={(e) => setSelectedDailyDate(e.target.value)}
                  className="input"
                  style={{ maxWidth: '220px', cursor: 'pointer' }}
                />
              </div>

              {/* Grid de Métricas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Total Ventas */}
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e2f0d9',
                    color: '#385723',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Ventas del Día</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>${dailyTotalSales}</strong>
                  </div>
                </div>

                {/* Comandas */}
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Comandas Cobradas</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>{dailyOrdersCount}</strong>
                  </div>
                </div>

                {/* Ticket Promedio */}
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Ticket Promedio</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>${dailyAverageTicket}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem' }}>
                {/* Ranking de Productos */}
                <div style={{ 
                  flex: '2 1 400px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <ShoppingBag size={20} style={{ color: 'var(--color-primary)' }} /> Control de Ventas por Producto
                    </h3>
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                      {['horizontal', 'vertical', 'donut', 'bubbles'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setDailyChartType(type)}
                          style={{
                            padding: '6px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: dailyChartType === type ? 'white' : 'transparent',
                            color: dailyChartType === type ? 'var(--color-primary)' : '#6b7280',
                            boxShadow: dailyChartType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          {type === 'horizontal' ? '📊 Horiz.' : type === 'vertical' ? '📶 Vert.' : type === 'donut' ? '🍩 Rosca' : '🔮 Burbujas'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {renderProductChart(sortedDailyProducts, dailyChartType, maxDailyQty)}

                    {sortedDailyProducts.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                        No se registraron ventas en la fecha seleccionada.
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de Cierre de Caja */}
                <div style={{ 
                  flex: '1 1 300px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  border: '1px solid #c8e2b8', 
                  backgroundColor: '#f4fbf0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#274e13', marginBottom: '0.75rem' }}>Cerrar Caja Diaria</h3>
                    <p style={{ fontSize: '0.85rem', color: '#385723', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                      Al realizar el cierre de caja, se guardará el estado consolidado de la facturación del día, cantidad de pedidos y ranking de productos en la base de datos de Firebase.
                    </p>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '10px',
                      padding: '1rem',
                      fontSize: '0.85rem',
                      color: '#4b5563',
                      border: '1px solid #e2ebd5',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Fecha:</span><strong>{selectedDailyDate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Venta Total:</span><strong>${dailyTotalSales}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Estado en DB:</span>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: closings.some(c => c.id === `closing_${selectedDailyDate}`) ? '#16a34a' : '#d97706' 
                        }}>
                          {closings.some(c => c.id === `closing_${selectedDailyDate}`) ? '🔒 CERRADO' : '📂 ABIERTO'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handlePerformDailyClosing}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px rgba(44, 62, 45, 0.15)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
                  >
                    🔒 Registrar Cierre de Caja
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO MONTHLY */}
          {reportsSubTab === 'monthly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Selector de Mes */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '1rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-primary)' }} /> Seleccionar Mes de Análisis
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Visualiza las estadísticas consolidadas e historial de cierres para el mes seleccionado.
                  </p>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input"
                  style={{ maxWidth: '220px', cursor: 'pointer' }}
                />
              </div>

              {/* Grid de Métricas del Mes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e2f0d9',
                    color: '#385723',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Ventas del Mes</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>${monthlyTotalSales}</strong>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Comandas Cobradas</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>{monthlyOrdersCount}</strong>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Ticket Promedio</span>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>${monthlyAverageTicket}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem' }}>
                {/* Ranking de Productos del Mes */}
                <div style={{ 
                  flex: '1 1 350px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <ShoppingBag size={20} style={{ color: 'var(--color-primary)' }} /> Popularidad del Mes
                    </h3>
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                      {['horizontal', 'vertical', 'donut', 'bubbles'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setMonthlyChartType(type)}
                          style={{
                            padding: '6px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: monthlyChartType === type ? 'white' : 'transparent',
                            color: monthlyChartType === type ? 'var(--color-primary)' : '#6b7280',
                            boxShadow: monthlyChartType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          {type === 'horizontal' ? '📊 Horiz.' : type === 'vertical' ? '📶 Vert.' : type === 'donut' ? '🍩 Rosca' : '🔮 Burbujas'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {renderProductChart(sortedMonthlyProducts, monthlyChartType, maxMonthlyQty)}

                    {sortedMonthlyProducts.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                        Sin datos de ventas en este mes.
                      </div>
                    )}
                  </div>
                </div>

                {/* Historial de Cierres de este Mes */}
                <div style={{ 
                  flex: '2 1 450px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <CheckCircle size={20} style={{ color: 'var(--color-primary)' }} /> Cierres Diarios Registrados ({monthlyClosings.length})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {monthlyClosings.map((closing, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.875rem 1.25rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>{closing.date}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginTop: '0.125rem' }}>
                            {closing.ordersCount} comandas • Ticket Promedio: ${closing.averageTicket}
                          </span>
                        </div>
                        <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          ${closing.totalSales}
                        </span>
                      </div>
                    ))}

                    {monthlyClosings.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '3.5rem 0', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '14px', backgroundColor: '#f9fafb' }}>
                        No se han registrado cierres de caja formales en este mes.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO YEARLY */}
          {reportsSubTab === 'yearly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Selector de Año */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '1rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-primary)' }} /> Seleccionar Año de Análisis
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                    Visualiza el desempeño y distribución mensual para el año seleccionado.
                  </p>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="input"
                  style={{ maxWidth: '220px', cursor: 'pointer' }}
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Tarjeta de Resumen Anual */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-primary)',
                padding: '2rem',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 4px 10px rgba(44, 62, 45, 0.15)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingresos Anuales Consolidados</span>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: '0.25rem 0 0 0', fontFamily: 'monospace' }}>
                    ${yearlyTotalSales}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: '#e5e7eb', display: 'block' }}>Comandas del Año</span>
                  <strong style={{ fontSize: '1.75rem', color: 'white', fontFamily: 'monospace' }}>{yearlyOrdersCount}</strong>
                </div>
              </div>

              {/* Gráfico de Barras Mensual */}
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '2.5rem', color: 'var(--color-primary)' }}>Evolución Mensual de Ventas</h3>
                
                {/* Contenedor del gráfico */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  height: '320px',
                  padding: '1rem 0',
                  borderBottom: '2px solid #e5e7eb',
                  gap: '6px',
                  overflowX: 'auto'
                }}>
                  {yearlyMonthsData.map((m, idx) => {
                    const barHeight = Math.max(8, Math.round((m.sales / maxYearlyMonthSales) * 100));
                    return (
                      <div key={idx} style={{
                        flex: '1 1 50px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end'
                      }}>
                        {/* Tooltip / Valor sobre la barra */}
                        {m.sales > 0 && (
                          <span style={{
                            fontSize: '0.725rem',
                            fontWeight: 'bold',
                            color: 'var(--color-primary)',
                            marginBottom: '6px',
                            whiteSpace: 'nowrap',
                            fontFamily: 'monospace'
                          }}>
                            ${m.sales}
                          </span>
                        )}
                        {/* Barra */}
                        <div 
                          title={`${m.name}: $${m.sales} (${m.count} comandas)`}
                          style={{
                            width: '80%',
                            maxWidth: '36px',
                            height: `${barHeight}%`,
                            background: 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-primary) 100%)',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.8s ease',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }} 
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.85';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        />
                        {/* Nombre del mes */}
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#4b5563',
                          fontWeight: '600',
                          marginTop: '8px'
                        }}>
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO HISTORIAL GENERAL */}
          {reportsSubTab === 'history' && (
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} style={{ color: 'var(--color-primary)' }} /> Listado Histórico de Cierres de Caja
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {closings.map((closing, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                    {/* Header del Cierre */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      borderBottom: '1px solid #f3f4f6',
                      paddingBottom: '0.75rem'
                    }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>Cierre de Caja {closing.date}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.125rem' }}>
                          Guardado el {new Date(closing.createdAt).toLocaleDateString()} a las {new Date(closing.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          ${closing.totalSales}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold', marginTop: '0.125rem' }}>
                          ✓ REGISTRADO
                        </span>
                      </div>
                    </div>

                    {/* Detalles del Cierre */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      fontSize: '0.85rem',
                      color: '#4b5563'
                    }}>
                      <div>
                        <strong>Comandas Procesadas:</strong> <span style={{ fontWeight: '600' }}>{closing.ordersCount}</span>
                      </div>
                      <div>
                        <strong>Ticket Promedio:</strong> <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>${closing.averageTicket}</span>
                      </div>
                      <div style={{ flex: '1 1 100%', marginTop: '0.25rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#374151' }}>Desglose de Ventas:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {closing.popularItems && closing.popularItems.map((item, idy) => (
                            <span key={idy} style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#f3f4f6',
                              color: '#4b5563',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: '500'
                            }}>
                              {item.qty}x {item.name}
                            </span>
                          ))}
                          {(!closing.popularItems || closing.popularItems.length === 0) && (
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Sin detalles de productos vendidos</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {closings.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '16px', backgroundColor: '#f9fafb' }}>
                    No se registran cierres de caja guardados en la base de datos.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido de la pestaña de SEGURIDAD */}
      {activeTab === 'security' && (
        <div className="animate-fade-in" style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          maxWidth: '500px',
          margin: '0 auto',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
            Cambiar Contraseña 🔑
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Actualiza tu contraseña de acceso para el panel de administración.
          </p>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {changePasswordError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {changePasswordError}
              </div>
            )}
            {changePasswordSuccess && (
              <div style={{
                backgroundColor: '#ecfdf5',
                color: '#047857',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {changePasswordSuccess}
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPasswordTab}
                onChange={(e) => setNewPasswordTab(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmNewPasswordTab}
                onChange={(e) => setConfirmNewPasswordTab(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '0.5rem',
                boxShadow: '0 4px 10px rgba(44, 62, 45, 0.15)'
              }}
            >
              Guardar Cambios 🔒
            </button>
          </form>
        </div>
      )}

      {/* MODAL FORM (Añadir / Editar) */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative',
            maxHeight: '90dvh',
            overflowY: 'auto'
          }}>
            <h2 style={{ 
              fontSize: '1.35rem', 
              fontFamily: 'var(--font-serif)', 
              color: 'var(--color-primary)', 
              marginBottom: '1.5rem',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '0.5rem'
            }}>
              {editingProduct ? 'Modificar Producto' : 'Cargar Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                  Nombre del Producto *
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Medialuna con Dulce de Leche"
                  required
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                    Precio ($) *
                  </label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2500"
                    min="0"
                    required
                    className="input"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                    Categoría *
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    style={{ height: '100%', cursor: 'pointer' }}
                  >
                    <option value="cafeteria">Cafetería</option>
                    <option value="heladeria">Heladería</option>
                    <option value="pasteleria">Pastelería</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                  Descripción
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles sobre el producto, ingredientes o porción..."
                  className="input"
                  rows="3"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.375rem' }}>
                  URL de Imagen (Cloudinary / Unsplash)
                </label>
                <input 
                  type="url" 
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://res.cloudinary.com/... o https://images.unsplash.com/..."
                  className="input"
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Puedes pegar el enlace de tu foto subida a Cloudinary o dejar en blanco para foto por defecto.
                </p>
              </div>

              {/* Sección de Realidad Aumentada y 3D */}
              <div style={{
                backgroundColor: '#F9F6F0',
                border: '1px solid #EBE4DA',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox"
                      checked={formData.hasAR}
                      onChange={(e) => setFormData({ ...formData, hasAR: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                    />
                    <span>✨ Habilitar Modelo 3D y Realidad Aumentada (AR)</span>
                  </label>
                </div>

                {formData.hasAR && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>
                        URL del Modelo 3D (.glb en Cloudinary o ruta local)
                      </label>
                      <input 
                        type="text"
                        value={formData.modelUrl}
                        onChange={(e) => setFormData({ ...formData, modelUrl: e.target.value })}
                        placeholder="https://res.cloudinary.com/.../mi_plato.glb o /models/teacup.glb"
                        className="input"
                        style={{ fontSize: '0.85rem' }}
                      />
                      <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: '1.3' }}>
                        💡 <strong>Importante:</strong> El modelo debe contener únicamente el producto con su taza/plato (<strong>sin mesas artificiales de fondo</strong>) para que se proyecte en la mesa real del cliente.
                      </p>
                    </div>

                    {/* Presets rápidos de modelos limpios */}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#8c827a', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                        Plantillas 3D disponibles sin mesa (clic para asignar):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, modelUrl: '/models/teacup.glb', widthCm: '12', heightCm: '8', depthCm: '12' })}
                          style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #D4A373', backgroundColor: formData.modelUrl === '/models/teacup.glb' ? '#2C3E2D' : '#FFF', color: formData.modelUrl === '/models/teacup.glb' ? '#FFF' : '#2C3E2D', cursor: 'pointer' }}
                        >
                          ☕ Taza Porcelana y Plato
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, modelUrl: '/models/icecream.glb', widthCm: '10', heightCm: '15', depthCm: '10' })}
                          style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #D4A373', backgroundColor: formData.modelUrl === '/models/icecream.glb' ? '#2C3E2D' : '#FFF', color: formData.modelUrl === '/models/icecream.glb' ? '#FFF' : '#2C3E2D', cursor: 'pointer' }}
                        >
                          🍨 Copa de Helado
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, modelUrl: '/models/dessert.glb', widthCm: '15', heightCm: '10', depthCm: '15' })}
                          style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #D4A373', backgroundColor: formData.modelUrl === '/models/dessert.glb' ? '#2C3E2D' : '#FFF', color: formData.modelUrl === '/models/dessert.glb' ? '#FFF' : '#2C3E2D', cursor: 'pointer' }}
                        >
                          🍰 Postre Parfait
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, modelUrl: '/models/dish.glb', widthCm: '20', heightCm: '6', depthCm: '20' })}
                          style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #D4A373', backgroundColor: formData.modelUrl === '/models/dish.glb' ? '#2C3E2D' : '#FFF', color: formData.modelUrl === '/models/dish.glb' ? '#FFF' : '#2C3E2D', cursor: 'pointer' }}
                        >
                          🍽️ Plato Servido
                        </button>
                      </div>
                    </div>

                    {/* Dimensiones Reales en cm */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>
                        Dimensiones Reales para AR (Escala 1:1 en centímetros)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Ancho (cm)</span>
                          <input 
                            type="number"
                            min="1"
                            max="200"
                            value={formData.widthCm}
                            onChange={(e) => setFormData({ ...formData, widthCm: e.target.value })}
                            className="input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Alto (cm)</span>
                          <input 
                            type="number"
                            min="1"
                            max="200"
                            value={formData.heightCm}
                            onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                            className="input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Profundidad (cm)</span>
                          <input 
                            type="number"
                            min="1"
                            max="200"
                            value={formData.depthCm}
                            onChange={(e) => setFormData({ ...formData, depthCm: e.target.value })}
                            className="input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '0.75rem', 
                borderTop: '1px solid #f3f4f6', 
                paddingTop: '1.25rem',
                marginTop: '0.5rem'
              }}>
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {editingProduct ? 'Modificar' : 'Cargar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
