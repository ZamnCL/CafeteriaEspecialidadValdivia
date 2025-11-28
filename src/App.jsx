import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Spinner } from 'react-bootstrap';
import Contacto from './pages/Contacto';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Admin from './pages/Admin';
import ProductoDetalle from './pages/ProductoDetalle';
import MiCuenta from './pages/MiCuenta';
import Checkout from './pages/Checkout';
import CompraExitosa from './pages/CompraExitosa';
import RectificarPago from './pages/RectificarPago';

// --- COMPONENTE DE PROTECCIÓN DE RUTA ---
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
              <Route path="/" element={<Home />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/producto/:id" element={<ProductoDetalle />} />
              
              {/* Rutas de Autenticación */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              
              {/* Rutas de Compra */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/compra-exitosa" element={<CompraExitosa />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/mi-cuenta" element={<MiCuenta />} />
              <Route path="/rectificar-pago/:idOrden" element={<RectificarPago />} />
              
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