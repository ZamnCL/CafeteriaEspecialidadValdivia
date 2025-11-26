import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/cliente'; // <--- CAMBIADO A cliente
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (user) {
      fetchCartFromDB(user.id);
    } else {
      const localCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
      setCart(localCart);
    }
  }, [user]);

  const fetchCartFromDB = async (userId) => {
    // Asegúrate que tu tabla se llame 'carrito_items' en Supabase
    const { data, error } = await supabase
      .from('carrito_items')
      .select('*, producto:productos(*), formato:formatos(*)')
      .eq('user_id', userId);
    
    if (!error && data) setCart(data);
  };

  const addToCart = async (producto, formato, cantidad = 1) => {
    const newItem = {
      id_producto: producto.id_producto,
      id_formato: formato.id_formato,
      cantidad: cantidad,
      producto: producto,
      formato: formato
    };

    if (!user) {
      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(
          item => item.id_producto === newItem.id_producto && item.id_formato === newItem.id_formato
        );
        
        let updatedCart;
        if (existingIndex >= 0) {
          updatedCart = [...prevCart];
          updatedCart[existingIndex].cantidad += cantidad;
        } else {
          updatedCart = [...prevCart, newItem];
        }
        
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        return updatedCart;
      });
    } else {
      setCart(prev => [...prev, newItem]); 
      const { error } = await supabase.from('carrito_items').upsert({
        user_id: user.id,
        id_producto: producto.id_producto,
        id_formato: formato.id_formato,
        cantidad: cantidad
      }, { onConflict: 'user_id, id_producto, id_formato' });

      if (error) console.error("Error DB:", error);
      fetchCartFromDB(user.id);
    }
  };

  const removeFromCart = async (productoId, formatoId) => {
    setCart(prev => prev.filter(item => !(item.id_producto === productoId && item.id_formato === formatoId)));
    
    if (!user) {
      const currentCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
      const newCart = currentCart.filter(item => !(item.id_producto === productoId && item.id_formato === formatoId));
      localStorage.setItem('guest_cart', JSON.stringify(newCart));
    } else {
      await supabase.from('carrito_items').delete().match({ user_id: user.id, id_producto: productoId, id_formato: formatoId });
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.formato.precio * item.cantidad), 0);
  };

  const clearCart = async () => {
    setCart([]);
    if (!user) {
      localStorage.removeItem('guest_cart');
    } else {
      await supabase.from('carrito_items').delete().eq('user_id', user.id);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getCartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);