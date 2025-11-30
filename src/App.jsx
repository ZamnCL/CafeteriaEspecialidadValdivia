import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// --- COMPONENTES ---
import Layout from './components/Layout';

// --- PÁGINAS (ORDEN ALFABÉTICO PARA ORDEN) ---
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Catalogo from './pages/Catalogo';
import Checkout from './pages/Checkout';
import CompraExitosa from './pages/CompraExitosa';
import Contacto from './pages/Contacto';
import Home from './pages/Home';
import Login from './pages/Login';
import MiCuenta from './pages/MiCuenta';
import ProductoDetalle from './pages/ProductoDetalle';
import RectificarPago from './pages/RectificarPago';
import Registro from './pages/Registro';
import Reserva from './pages/Reserva';
import Resenas from './pages/Resenas'; // Asegúrate de que este archivo exista en src/pages/Resenas.jsx

// --- COMPONENTE DE PROTECCIÓN DE RUTA (ADMIN) ---
const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="text-center mt-5 py-5"><Spinner animation="border" variant="secondary"/></div>;
  
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
              {/* RUTAS PÚBLICAS */}
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/reserva" element={<Reserva />} />
              <Route path="/resenas" element={<Resenas />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/producto/:id" element={<ProductoDetalle />} />
              <Route path="/carrito" element={<Cart />} />
              
              {/* RUTAS DE AUTENTICACIÓN */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              
              {/* RUTAS PROTEGIDAS / USUARIO */}
              <Route path="/mi-cuenta" element={<MiCuenta />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/compra-exitosa" element={<CompraExitosa />} />
              <Route path="/rectificar-pago/:idOrden" element={<RectificarPago />} />
              
              {/* RUTA PROTEGIDA ADMIN */}
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