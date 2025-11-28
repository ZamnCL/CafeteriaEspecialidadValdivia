import { Outlet, Link } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaUser } from 'react-icons/fa';

function Layout() {
  // 1. AHORA DESESTRUCTURAMOS TAMBIÉN EL 'role'
  const { user, signOut, role } = useAuth(); 
  const { cart } = useCart();
  
  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar expand="lg" fixed="top" className="navbar-custom">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold">
            CAFÉ VALDIVIA
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto align-items-center">
              <Nav.Link as={Link} to="/">Inicio</Nav.Link>
              <Nav.Link as={Link} to="/catalogo">Tienda</Nav.Link>
              <Nav.Link as={Link} to="/contacto">Contacto</Nav.Link>
            </Nav>

            <Nav className="align-items-center gap-3 mt-3 mt-lg-0">
              {user ? (
                <NavDropdown 
                  title={<span className="d-inline-flex align-items-center text-coffee fw-bold"><FaUser className="me-2" /> Mi Cuenta</span>} 
                  id="user-dropdown" 
                  align="end"
                >
                  <NavDropdown.Header className="small text-muted">{user.email?.split('@')[0]}</NavDropdown.Header>
                  <NavDropdown.Item as={Link} to="/mi-cuenta">Perfil y Pedidos</NavDropdown.Item>
                  
                  {/* 2. CONDICIÓN: SOLO MOSTRAR SI EL ROL ES ADMIN */}
                  {role === 'admin' && (
                    <NavDropdown.Item as={Link} to="/admin">Panel Admin</NavDropdown.Item>
                  )}

                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={signOut} className="text-danger">Cerrar Sesión</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Link to="/login" className="text-coffee d-flex align-items-center text-decoration-none fw-bold">
                  <FaUser className="me-2" /> <span className="d-lg-none">Iniciar Sesión</span>
                </Link>
              )}

              <Link to="/carrito" className="position-relative text-coffee fs-5 ms-lg-2 d-flex align-items-center text-decoration-none">
                <FaShoppingCart />
                {totalItems > 0 && (
                  <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6rem', border: '1px solid white' }}>
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 mt-5 pt-4">
        <Outlet />
      </main>

      <footer className="footer-custom">
        <Container>
          <div className="row gy-4">
            <div className="col-md-4 footer-section">
              <h4>Café Valdivia</h4>
              <p className="text-white-50 small">Tostaduría de especialidad en el corazón del sur de Chile.</p>
            </div>
            <div className="col-md-4 footer-section">
              <h4>Navegación</h4>
              <Link to="/">Inicio</Link>
              <Link to="/carrito">Carrito</Link>
            </div>
            <div className="col-md-4 footer-section">
              <h4>Contacto</h4>
              <p className="text-white-50 small mb-1">Av. Alemania 123, Valdivia</p>
              <p className="text-white-50 small">hola@cafevaldivia.cl</p>
            </div>
          </div>
          <div className="text-center mt-5 pt-3 border-top border-secondary">
            <small className="text-white-50">© {new Date().getFullYear()} Café Valdivia.</small>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default Layout;