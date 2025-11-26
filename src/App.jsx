import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Catalogo from './pages/Catalogo';

// Componentes
import Layout from './components/Layout';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ProductoDetalle from './pages/ProductoDetalle';
import MiCuenta from './pages/MiCuenta'; // <--- 1. IMPORTAR AQUÍ

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
              
              {/* Rutas de Usuario/Admin */}
              <Route path="/login" element={<Login />} />
              <Route path="/mi-cuenta" element={<MiCuenta />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/catalogo" element={<Catalogo />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;