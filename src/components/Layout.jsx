import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container, Badge, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaInstagram, FaFacebook } from 'react-icons/fa';

function Layout() {
  const { user, signOut, role } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  
  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const scrollToMap = () => {
    if (location.pathname === '/') {
      const element = document.getElementById('visitanos');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      
      {/* NAVBAR */}
      <Navbar expand="lg" fixed="top" className="navbar-custom">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold">
            CAFETERÍA ESPECIALIDAD VALDIVIA
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto align-items-center">
              <Nav.Link as={Link} to="/">Inicio</Nav.Link>
              <Nav.Link as={Link} to="/catalogo">Tienda</Nav.Link>
              <Nav.Link as={Link} to="/reserva">Reserva</Nav.Link>
              <Nav.Link as={Link} to="/resenas">Reseñas</Nav.Link> {/* NUEVO LINK */}
              <Nav.Link as={Link} to="/contacto">Contacto</Nav.Link>
              
              <Nav.Link as={Link} to="/#visitanos" onClick={scrollToMap}>
                Visítanos
              </Nav.Link>

            </Nav>

            <Nav className="align-items-center gap-3 mt-3 mt-lg-0">
              {user ? (
                <NavDropdown title={<span className="d-inline-flex align-items-center text-coffee fw-bold"><FaUser className="me-2" /> Mi Cuenta</span>} id="user-dropdown" align="end">
                  <NavDropdown.Header className="small text-muted">{user.email?.split('@')[0]}</NavDropdown.Header>
                  <NavDropdown.Item as={Link} to="/mi-cuenta">Perfil y Pedidos</NavDropdown.Item>
                  {role === 'admin' && <NavDropdown.Item as={Link} to="/admin">Panel Admin</NavDropdown.Item>}
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
                {totalItems > 0 && <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6rem', border: '1px solid white' }}>{totalItems}</Badge>}
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 mt-5 pt-4">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="footer-custom">
        <Container>
          <Row className="gy-4 justify-content-between align-items-center">
            <Col md={4}>
              <h5 className="fw-bold text-uppercase mb-2" style={{color: 'var(--coffee-accent)'}}>Café Valdivia</h5>
              <p className="small opacity-75 mb-0">El mejor café universitario del sur.</p>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="d-flex gap-3 justify-content-md-end">
                <FaInstagram className="text-white fs-4"/>
                <FaFacebook className="text-white fs-4"/>
              </div>
            </Col>
          </Row>
          <div className="text-center mt-4 pt-3 border-top border-secondary opacity-50 small">
            © {new Date().getFullYear()} Cafetería Especialidad Valdivia.
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default Layout;