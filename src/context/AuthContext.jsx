import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/cliente';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // <--- NUEVO ESTADO PARA EL ROL
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleUserSession(session); // Usamos una función auxiliar
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función auxiliar para obtener usuario Y rol
  const handleUserSession = async (session) => {
    if (session?.user) {
      setUser(session.user);
      
      // Consultamos la tabla perfiles
      const { data } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single();
      
      setRole(data?.rol || 'cliente'); // Si no hay dato, asume cliente por seguridad
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    // Exponemos 'role' al resto de la app
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);