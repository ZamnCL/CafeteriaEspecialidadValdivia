import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/cliente';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticación...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error al obtener sesión:', error);
        } else if (session) {
          console.log('✅ Sesión recuperada:', session.user.email);
        } else {
          console.log('ℹ️ No hay sesión activa');
        }

        await handleUserSession(session);
      } catch (error) {
        console.error('❌ Error al inicializar sesión:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Cambio de estado de auth:', event);
      await handleUserSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (session) => {
    try {
      if (session?.user) {
        setUser(session.user);

        const { data } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single();

        setRole(data?.rol || 'cliente');
        console.log('👤 Usuario establecido:', session.user.email, 'Rol:', data?.rol || 'cliente');
      } else {
        setUser(null);
        setRole(null);
        console.log('👤 Usuario limpiado');
      }
    } catch (error) {
      console.error('❌ Error al manejar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);