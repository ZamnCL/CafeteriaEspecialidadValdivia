import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // <--- Importa Navigate
import { AuthProvider, useAuth } from './context/AuthContext'; // <--- Importa useAuth
import { CartProvider } from './context/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Spinner } from 'react-bootstrap'; // Opcional para loading

// Componentes y Páginas
import Layout from './components/Layout';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ProductoDetalle from './pages/ProductoDetalle';
import MiCuenta from './pages/MiCuenta';
import Catalogo from './pages/Catalogo';

// --- NUEVO COMPONENTE DE PROTECCIÓN ---
const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="text-center mt-5"><Spinner animation="border"/></div>;
  
  // Si no hay usuario O el rol no es admin, mandar al Home
  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/producto/:id" element={<ProductoDetalle />} />
              <Route path="/login" element={<Login />} />
              <Route path="/mi-cuenta" element={<MiCuenta />} />
              <Route path="/catalogo" element={<Catalogo />} />
              
              {/* --- RUTA PROTEGIDA --- */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } 
              />
              
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;