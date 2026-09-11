import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/cliente';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Escuchar el estado de autenticación (sin consultas pesadas adentro)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Cambio de estado de auth:', event);
      
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Obtener el rol en un efecto separado (evita el deadlock con Supabase)
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchUserRole = async () => {
      try {
        console.log('🔍 Consultando rol en perfiles para:', user.email);
        
        // maybeSingle() evita que lance un error crítico si el perfil aún no tiene fila
        const { data, error } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('⚠️ Error al consultar perfil:', error.message);
        }

        if (isMounted) {
          const userRole = data?.rol || 'cliente';
          setRole(userRole);
          console.log('👤 Usuario establecido:', user.email, '| Rol:', userRole);
        }
      } catch (error) {
        console.error('❌ Error al obtener rol:', error);
        if (isMounted) setRole('cliente');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 3. Cerrar sesión limpio
  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      setRole(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);