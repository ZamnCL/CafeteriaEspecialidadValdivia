import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Layout from './components/Layout';

import Admin from './pages/Admin';
import Blog from './pages/Blog';
import Cart from './pages/Cart';
import Catalogo from './pages/Catalogo';
import Checkout from './pages/Checkout';
import CompraExitosa from './pages/CompraExitosa';
import CompraFallida from './pages/CompraFallida';
import Contacto from './pages/Contacto';
import Home from './pages/Home';
import Login from './pages/Login';
import MiCuenta from './pages/MiCuenta';
import ProductoDetalle from './pages/ProductoDetalle';
import RectificarPago from './pages/RectificarPago';
import Registro from './pages/Registro';
import Resenas from './pages/Resenas';
import Reserva from './pages/Reserva';

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5 py-5"><Spinner animation="border" variant="secondary"/></div>;
  }

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
            <Route path="/" element={<Layout />}>

              <Route index element={<Home />} />
              <Route path="blog" element={<Blog />} />
              <Route path="carrito" element={<Cart />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="compra-exitosa" element={<CompraExitosa />} />
              <Route path="compra-fallida" element={<CompraFallida />} />
              <Route path="contacto" element={<Contacto />} />
              <Route path="login" element={<Login />} />
              <Route path="producto/:id" element={<ProductoDetalle />} />
              <Route path="rectificar-pago/:idOrden" element={<RectificarPago />} />
              <Route path="registro" element={<Registro />} />
              <Route path="resenas" element={<Resenas />} />
              <Route path="reserva" element={<Reserva />} />

              <Route path="mi-cuenta" element={<MiCuenta />} />

              <Route
                path="admin"
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