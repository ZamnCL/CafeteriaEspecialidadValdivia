import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/cliente';
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
    // Obtenemos también la columna datos_reserva
    const { data, error } = await supabase
      .from('carrito_items')
      .select('*, producto:productos(*), formato:formatos(*)')
      .eq('user_id', userId);
    
    if (!error && data) {
      // Mapeamos para que la app entienda 'reserva'
      const formattedCart = data.map(item => ({
        ...item,
        reserva: item.datos_reserva 
      }));
      setCart(formattedCart);
    }
  };

  // --- AGREGAR (Con soporte para Reserva) ---
  const addToCart = async (producto, formatoId, formatoNombre, precio, cantidad = 1, reservationInfo = null) => {
    
    const newItem = {
      id_producto: producto.id_producto,
      id_formato: formatoId,
      cantidad: cantidad,
      producto: producto,
      formato: { id_formato: formatoId, nombre: formatoNombre, precio: Number(precio) }, // Estructura segura
      reserva: reservationInfo
    };

    // Helper para comparar si dos items son idénticos (incluyendo hora)
    const itemsSonIguales = (item1, item2) => {
      return item1.id_producto === item2.id_producto && 
             item1.id_formato === item2.id_formato &&
             JSON.stringify(item1.reserva) === JSON.stringify(item2.reserva);
    };

    if (!user) {
      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(item => itemsSonIguales(item, newItem));
        
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
      // Optimistic UI
      setCart(prev => [...prev, newItem]); 

      // Guardar en Supabase
      const { error } = await supabase.from('carrito_items').upsert({
        user_id: user.id,
        id_producto: producto.id_producto,
        id_formato: formatoId,
        cantidad: cantidad,
        datos_reserva: reservationInfo // Guardamos la hora aquí
      }, { 
        onConflict: 'user_id, id_producto, id_formato' 
      });

      if (error) console.error("Error DB:", error);
      fetchCartFromDB(user.id);
    }
  };

  // --- ELIMINAR ---
  const removeFromCart = async (productoId, formatoId, reservationInfo = null) => {
    setCart(prev => prev.filter(item => 
      !(item.id_producto === productoId && 
        item.id_formato === formatoId &&
        JSON.stringify(item.reserva) === JSON.stringify(reservationInfo))
    ));
    
    if (!user) {
      const currentCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
      const newCart = currentCart.filter(item => 
        !(item.id_producto === productoId && 
          item.id_formato === formatoId &&
          JSON.stringify(item.reserva) === JSON.stringify(reservationInfo))
      );
      localStorage.setItem('guest_cart', JSON.stringify(newCart));
    } else {
      await supabase.from('carrito_items').delete().match({ 
        user_id: user.id, 
        id_producto: productoId, 
        id_formato: formatoId 
      });
    }
  };

  // --- ACTUALIZAR CANTIDAD ---
  const updateQuantity = async (productId, formatId, newQuantity, reservationInfo = null) => {
    setCart(currCart =>
      currCart.map(item =>
        item.id_producto === productId && 
        item.id_formato === formatId &&
        JSON.stringify(item.reserva) === JSON.stringify(reservationInfo)
          ? { ...item, cantidad: newQuantity }
          : item
      )
    );

    if (user) {
       await supabase.from('carrito_items').update({ cantidad: newQuantity }).match({ 
        user_id: user.id, 
        id_producto: productId, 
        id_formato: formatId 
      });
    } else {
      const currentCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
      const updated = currentCart.map(item =>
        item.id_producto === productId && 
        item.id_formato === formatId &&
        JSON.stringify(item.reserva) === JSON.stringify(reservationInfo)
          ? { ...item, cantidad: newQuantity }
          : item
      );
      localStorage.setItem('guest_cart', JSON.stringify(updated));
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (!user) {
      localStorage.removeItem('guest_cart');
    } else {
      await supabase.from('carrito_items').delete().eq('user_id', user.id);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.formato.precio * item.cantidad), 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getCartTotal, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);