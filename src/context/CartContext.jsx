import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabase/cliente';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      const storedCart = localStorage.getItem('guestCart');
      if (storedCart) setCart(JSON.parse(storedCart));
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from('carrito_items')
        .select(`
          *,
          producto:productos (*),
          formato:formatos (*)
        `)
        .eq('user_id', user.id)
        // SOLUCIÓN: Ordenamos por fecha de creación para que no se muevan
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filtro de seguridad por si se borró un producto de la BD
      const validItems = (data || []).filter(item => item.producto && item.formato);
      
      setCart(validItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (producto, idFormato, nombreFormato, precio, cantidad, reservaData = null) => {
    // Actualización optimista
    const tempItem = { 
        id_producto: producto.id_producto, 
        id_formato: idFormato, 
        cantidad, 
        producto, 
        formato: { id_formato: idFormato, nombre: nombreFormato, precio }, 
        reserva: reservaData 
    };

    if (!user) {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => item.id_producto === tempItem.id_producto && item.id_formato === tempItem.id_formato);
        let newCart = [...prev];
        if (existingIdx > -1) {
            newCart[existingIdx].cantidad += cantidad;
        } else {
            newCart.push(tempItem);
        }
        localStorage.setItem('guestCart', JSON.stringify(newCart));
        return newCart;
      });
    } else {
      // Para usuario logueado
      setCart(prev => {
          // Verificamos si ya existe visualmente para no duplicar en UI
          const exists = prev.some(item => item.id_producto === tempItem.id_producto && item.id_formato === tempItem.id_formato);
          if (exists) {
              return prev.map(item => item.id_producto === tempItem.id_producto && item.id_formato === tempItem.id_formato 
                  ? { ...item, cantidad: item.cantidad + cantidad } 
                  : item);
          }
          return [...prev, tempItem];
      }); 
      
      // Lógica BD
      const existingItem = cart.find(item => item.id_producto === producto.id_producto && item.id_formato === idFormato);
      const nuevaCantidad = existingItem ? existingItem.cantidad + cantidad : cantidad;

      const { error } = await supabase
        .from('carrito_items')
        .upsert({ 
          user_id: user.id, 
          id_producto: producto.id_producto, 
          id_formato: idFormato, 
          cantidad: nuevaCantidad,
          datos_reserva: reservaData 
        });

      if (!error) fetchCart();
    }
  };

  const removeFromCart = async (idProducto, idFormato, reserva = null) => {
    const newCart = cart.filter(item => !(item.id_producto === idProducto && item.id_formato === idFormato));
    setCart(newCart);

    if (!user) {
      localStorage.setItem('guestCart', JSON.stringify(newCart));
    } else {
      await supabase
        .from('carrito_items')
        .delete()
        .match({ user_id: user.id, id_producto: idProducto, id_formato: idFormato });
    }
  };

  const updateQuantity = async (idProducto, idFormato, quantity) => {
    if (quantity < 1) return;
    
    // 1. Actualización Visual Inmediata (Mantiene el orden actual del array)
    setCart(prev => prev.map(item => item.id_producto === idProducto && item.id_formato === idFormato ? { ...item, cantidad: quantity } : item));

    if (!user) {
      const current = JSON.parse(localStorage.getItem('guestCart')) || [];
      const updated = current.map(item => item.id_producto === idProducto && item.id_formato === idFormato ? { ...item, cantidad: quantity } : item);
      localStorage.setItem('guestCart', JSON.stringify(updated));
    } else {
      // 2. Actualización BD
      const { error } = await supabase
        .from('carrito_items')
        .update({ cantidad: quantity })
        .match({ user_id: user.id, id_producto: idProducto, id_formato: idFormato });

      // 3. Al refrescar, el .order('created_at') en fetchCart evitará que salten
      if (!error) fetchCart();
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (!user) {
      localStorage.removeItem('guestCart');
    } else {
      await supabase.from('carrito_items').delete().eq('user_id', user.id);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
        const precio = item.formato?.precio || 0;
        return total + (precio * item.cantidad);
    }, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal }}>
      {children}
    </CartContext.Provider>
  );
};