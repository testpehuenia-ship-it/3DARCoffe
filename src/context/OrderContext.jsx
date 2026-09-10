import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

const DEFAULT_MENU = [
  { 
    id: 'c1', 
    name: 'Café de Especialidad', 
    description: 'Origen Colombia, notas a chocolate y nuez', 
    price: 2500, 
    category: 'cafeteria', 
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80', 
    isActive: true,
    hasAR: true,
    modelUrl: '/models/teacup.glb',
    iosModelUrl: null,
    dimensions: { width: 0.12, height: 0.08, depth: 0.12 }
  },
  { 
    id: 'c2', 
    name: 'Latte Patagonia', 
    description: 'Espresso con leche texturizada y syrup de lavanda', 
    price: 3200, 
    category: 'cafeteria', 
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&q=80', 
    isActive: true,
    hasAR: true,
    modelUrl: '/models/teacup.glb',
    iosModelUrl: null,
    dimensions: { width: 0.14, height: 0.08, depth: 0.14 }
  },
  { 
    id: 'c3', 
    name: 'Chocolate Caliente Submarino', 
    description: 'Leche hirviendo con barra de chocolate amargo 70%', 
    price: 3500, 
    category: 'cafeteria', 
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80', 
    isActive: true,
    hasAR: true,
    modelUrl: '/models/teacup.glb',
    iosModelUrl: null,
    dimensions: { width: 0.12, height: 0.08, depth: 0.12 }
  },
  { 
    id: 'h1', 
    name: 'Helado Artesanal', 
    description: 'Sabores a elección: Calafate, Dulce de Leche, Chocolate', 
    price: 2000, 
    category: 'heladeria', 
    image: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&q=80', 
    isActive: true,
    hasAR: true,
    modelUrl: '/models/icecream.glb',
    iosModelUrl: null,
    dimensions: { width: 0.10, height: 0.15, depth: 0.10 }
  },
  { 
    id: 'p1', 
    name: 'Torta Galesa', 
    description: 'Porción de receta tradicional del sur con frutos secos', 
    price: 4000, 
    category: 'pasteleria', 
    image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', 
    isActive: true,
    hasAR: true,
    modelUrl: '/models/dessert.glb',
    iosModelUrl: null,
    dimensions: { width: 0.15, height: 0.10, depth: 0.15 }
  },
];

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('patagonia_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('patagonia_menu');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(item => {
          const defaultItem = DEFAULT_MENU.find(d => d.id === item.id);
          if (defaultItem && defaultItem.hasAR && !item.hasAR) {
            return { ...item, ...defaultItem };
          }
          return item;
        });
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_MENU;
  });

  const [closings, setClosings] = useState(() => {
    const saved = localStorage.getItem('patagonia_closings');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeOrderId, setActiveOrderId] = useState(() => {
    return localStorage.getItem('patagonia_active_order_id') || null;
  });

  const activeOrderIdRef = React.useRef(activeOrderId);
  activeOrderIdRef.current = activeOrderId;

  const [cart, setCart] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch helpers para la API local (Fallback)
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setHasFetched(true);
        const currentActiveId = activeOrderIdRef.current;
        setOrders(prevOrders => {
          const activeLocalOrder = prevOrders.find(o => o.id === currentActiveId);
          
          // 1. Mapeamos las órdenes del servidor y combinamos con la local si coincide
          let merged = data.map(serverOrder => {
            if (activeLocalOrder && serverOrder.id === currentActiveId) {
              return {
                ...serverOrder,
                billRequested: serverOrder.billRequested || activeLocalOrder.billRequested
              };
            }
            return serverOrder;
          });

          // 2. Si la orden activa local no está en el listado del servidor, la agregamos al principio
          if (activeLocalOrder && !data.some(o => o.id === currentActiveId)) {
            merged = [activeLocalOrder, ...merged];
          }

          return merged;
        });
      }
    } catch (e) {
      // Fallback a localStorage silencioso
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (e) {
      // Fallback a localStorage silencioso
    }
  };

  // Sincronización en Tiempo Real con Firebase o Polling en Local
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      console.log("📡 Conectando suscripciones en tiempo real con Firestore...");
      
      // 1. Suscripción a la Carta (Menú)
      const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
        const items = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const defaultItem = DEFAULT_MENU.find(d => d.id === docSnap.id);
          items.push({ 
            id: docSnap.id, 
            ...defaultItem,
            ...data,
            hasAR: data.hasAR !== undefined ? data.hasAR : (defaultItem?.hasAR || false),
            modelUrl: data.modelUrl || defaultItem?.modelUrl || null,
            dimensions: data.dimensions || defaultItem?.dimensions || null,
            iosModelUrl: data.iosModelUrl || defaultItem?.iosModelUrl || null
          });
        });
        setMenuItems(items);
        
        // Inicialización automática e idempotente si la carta en la nube está vacía
        if (snapshot.empty) {
          console.log("🌱 Carta de base de datos vacía. Inicializando con menú por defecto...");
          DEFAULT_MENU.forEach(async (item) => {
            await setDoc(doc(db, 'menu', item.id), item);
          });
        }
      });

      // 2. Suscripción a los Pedidos
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const items = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        setHasFetched(true);
        setOrders(items);
      });

      // 3. Suscripción a los Cierres de Caja
      const qClosings = query(collection(db, 'closings'), orderBy('createdAt', 'desc'));
      const unsubscribeClosings = onSnapshot(qClosings, (snapshot) => {
        const items = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        setClosings(items);
      });

      return () => {
        unsubscribeMenu();
        unsubscribeOrders();
        unsubscribeClosings();
      };
    } else {
      // Polling fallback para API local ( Vite Dev Server )
      fetchOrders();
      fetchMenu();

      const interval = setInterval(() => {
        fetchOrders();
        fetchMenu();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, []);

  // Sincronización a localStorage
  useEffect(() => {
    localStorage.setItem('patagonia_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('patagonia_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('patagonia_closings', JSON.stringify(closings));
  }, [closings]);

  useEffect(() => {
    if (activeOrderId) {
      localStorage.setItem('patagonia_active_order_id', activeOrderId);
    } else {
      localStorage.removeItem('patagonia_active_order_id');
    }
  }, [activeOrderId]);

  // Limpiar ID de pedido activo si se ha sincronizado con el servidor y ya no existe
  useEffect(() => {
    if (hasFetched && activeOrderId) {
      const exists = orders.some(o => o.id === activeOrderId);
      if (!exists) {
        setActiveOrderId(null);
      }
    }
  }, [hasFetched, orders, activeOrderId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const clearCart = () => setCart([]);

  const submitOrder = async (customerName) => {
    const newId = Date.now().toString();
    const newOrder = {
      id: newId,
      customerName,
      items: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'para_despachar', // estados: para_despachar, visto_en_despacho, despachado, finalizado
      billRequested: false,
      createdAt: new Date().toISOString()
    };
    
    // Guardar el pedido (Firebase o API Local)
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'orders', newId), newOrder);
      } catch (e) {
        console.error('Error al guardar pedido en Firestore:', e);
        throw new Error('No se pudo enviar el pedido a la base de datos (Firebase). Por favor, intenta nuevamente o consulta al personal.');
      }
    } else {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
        });
        if (!res.ok) {
          throw new Error(`Error en el servidor local: ${res.status}`);
        }
      } catch (e) {
        console.error('Error al enviar el pedido a la API local:', e);
        throw new Error('No se pudo enviar el pedido al servidor local. Por favor, intenta nuevamente o consulta al personal.');
      }
    }

    // Actualizamos el estado local (solo si se guardó correctamente)
    setOrders(prev => [newOrder, ...prev]);
    setActiveOrderId(newId);
    clearCart();

    return newId;
  };

  const deleteOrder = async (orderId) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
    }
    
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (e) {
        console.error('Error al eliminar pedido en Firestore:', e);
        throw new Error('No se pudo eliminar el pedido en la base de datos.');
      }
    } else {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('Failed to delete order on API', e);
      }
    }
  };

  const loadOrderToCart = (items) => {
    setCart(items);
  };


  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      } catch (e) {
        console.error('Error al actualizar estado en Firestore:', e);
      }
    } else {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {
        console.warn('Failed to update status on API', e);
      }
    }
  };

  const requestBill = async (orderId) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, billRequested: true } : order
    ));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { billRequested: true });
      } catch (e) {
        console.error('Error al solicitar cuenta en Firestore:', e);
      }
    } else {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billRequested: true })
        });
      } catch (e) {
        console.warn('Failed to request bill on API', e);
      }
    }
  };

  const clearActiveOrder = () => {
    setActiveOrderId(null);
  };

  // CRUD Menu Items
  const addMenuItem = async (item) => {
    const newId = Date.now().toString();
    const newItem = {
      ...item,
      id: newId,
      price: Number(item.price),
      isActive: true
    };
    setMenuItems(prev => [...prev, newItem]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'menu', newId), newItem);
      } catch (e) {
        console.error('Error al añadir producto en Firestore:', e);
      }
    } else {
      try {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
      } catch (e) {
        console.warn('Failed to add menu item on API', e);
      }
    }
  };

  const updateMenuItem = async (updatedItem) => {
    const formattedItem = {
      ...updatedItem,
      price: Number(updatedItem.price)
    };
    setMenuItems(prev => prev.map(item => 
      item.id === updatedItem.id ? formattedItem : item
    ));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'menu', updatedItem.id), formattedItem);
      } catch (e) {
        console.error('Error al modificar producto en Firestore:', e);
      }
    } else {
      try {
        await fetch(`/api/menu/${updatedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem)
        });
      } catch (e) {
        console.warn('Failed to update menu item on API', e);
      }
    }
  };

  const toggleMenuItemActive = async (itemId) => {
    let isNowActive = true;
    setMenuItems(prev => prev.map(item => {
      if (item.id === itemId) {
        isNowActive = !item.isActive;
        return { ...item, isActive: isNowActive };
      }
      return item;
    }));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'menu', itemId), { isActive: isNowActive });
      } catch (e) {
        console.error('Error al alternar estado en Firestore:', e);
      }
    } else {
      try {
        await fetch(`/api/menu/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: isNowActive })
        });
      } catch (e) {
        console.warn('Failed to toggle menu item status on API', e);
      }
    }
  };

  const deleteMenuItem = async (itemId) => {
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    setCart(prev => prev.filter(item => item.id !== itemId));

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'menu', itemId));
      } catch (e) {
        console.error('Error al eliminar producto en Firestore:', e);
      }
    } else {
      try {
        await fetch(`/api/menu/${itemId}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('Failed to delete menu item on API', e);
      }
    }
  };

  const saveClosing = async (closingData) => {
    const id = closingData.id || `closing_${Date.now()}`;
    const newClosing = {
      ...closingData,
      id,
      createdAt: new Date().toISOString()
    };

    setClosings(prev => {
      const exists = prev.some(c => c.id === id);
      if (exists) return prev.map(c => c.id === id ? newClosing : c);
      return [newClosing, ...prev];
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'closings', id), newClosing);
        console.log(`🔒 Cierre de caja ${id} guardado en Firestore.`);
      } catch (e) {
        console.error('Error al guardar cierre de caja en Firestore:', e);
      }
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      menuItems,
      closings,
      activeOrderId,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      submitOrder,
      deleteOrder,
      loadOrderToCart,
      updateOrderStatus,
      requestBill,
      clearActiveOrder,
      addMenuItem,
      updateMenuItem,
      toggleMenuItemActive,
      deleteMenuItem,
      saveClosing
    }}>
      {children}
    </OrderContext.Provider>
  );
};
