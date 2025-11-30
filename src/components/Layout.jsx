import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container, Badge, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabase/cliente';
import { FaShoppingCart, FaUser, FaInstagram, FaFacebook } from 'react-icons/fa';

function Layout() {
  const { user, signOut, role } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  
  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const [catsTienda, setCatsTienda] = useState([]);
  const [catsReserva, setCatsReserva] = useState([]);
  
  const [showTienda, setShowTienda] = useState(false);
  const [showReserva, setShowReserva] = useState(false);

  // Referencia para guardar los timers y evitar cierres bruscos dentro del área
  const timerRef = useRef({});

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data } = await supabase.from('categoria').select('*');
      if (data) {
        const esReserva = (n) => {
          const name = n.toLowerCase();
          return name.includes('preparación') || name.includes('filtrado') || name.includes('bebida') || name.includes('barra') || name.includes('métodos') || name.includes('servicio') || name.includes('pastelería') || name.includes('sandwich');
        };

        setCatsTienda(data.filter(c => !esReserva(c.nombre)));
        setCatsReserva(data.filter(c => esReserva(c.nombre)));
      }
    } catch (err) {
      console.error("Error cargando categorías menú", err);
    }
  };

  const scrollToMap = () => {
    if (location.pathname === '/') {
      const element = document.getElementById('visitanos');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const irACategoria = (ruta, idCat) => {
    setShowTienda(false);
    setShowReserva(false);
    if (timerRef.current.tienda) clearTimeout(timerRef.current.tienda);
    if (timerRef.current.reserva) clearTimeout(timerRef.current.reserva);
    
    navigate(`${ruta}?categoria=${idCat}`);
  };

  // --- LÓGICA DE HOVER MEJORADA (ÁREA + EXCLUSIÓN MUTUA) ---
  const handleMouseEnter = (menu) => {
    // 1. Limpiar timer de este menú si existe (el usuario volvió a entrar al área segura)
    if (timerRef.current[menu]) {
      clearTimeout(timerRef.current[menu]);
      delete timerRef.current[menu];
    }
    
    // 2. ABRIR el menú actual y CERRAR EL OTRO inmediatamente.
    // Esto soluciona que se solapen si mueves el mouse rápido de "Tienda" a "Reserva".
    if (menu === 'tienda') {
        setShowTienda(true);
        setShowReserva(false);
    }
    if (menu === 'reserva') {
        setShowReserva(true);
        setShowTienda(false);
    }
  };

  const handleMouseLeave = (menu) => {
    // Timer muy breve (100ms) solo para cubrir el pequeño "gap" físico entre botón y menú.
    // Si sales del área total, se cierra casi de inmediato, sintiéndose ágil.
    timerRef.current[menu] = setTimeout(() => {
      if (menu === 'tienda') setShowTienda(false);
      if (menu === 'reserva') setShowReserva(false);
    }, 100); 
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <style>{`
        /* Centrar y posicionar el menú debajo del botón */
        .centered-dropdown .dropdown-menu {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            margin-top: 0px !important; /* Pegado al botón para minimizar el gap */
            border-radius: 12px;
            border: 1px solid rgba(0,0,0,0.05);
            box-shadow: 0 10px 25px rgba(92, 61, 46, 0.15);
            text-align: center; /* Centrar texto de los items */
            min-width: 200px;
            padding: 0.5rem 0;
        }

        /* Estilo de los items del menú */
        .centered-dropdown .dropdown-item {
            text-align: center;
            font-weight: 500;
            color: #555;
            padding: 10px 15px;
            transition: background-color 0.2s, color 0.2s;
        }
        
        .centered-dropdown .dropdown-item:hover {
            background-color: rgba(196, 164, 132, 0.1);
            color: var(--coffee-dark);
        }
        
        /* Ajuste alineación flecha */
        .nav-link.dropdown-toggle::after {
            vertical-align: middle;
        }
      `}</style>

      {/* NAVBAR */}
      <Navbar expand="lg" fixed="top" className="navbar-custom">
        <Container fluid className="px-4 px-lg-5">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold">
            CAFETERÍA ESPECIALIDAD VALDIVIA
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto align-items-center gap-2">
              <Nav.Link as={Link} to="/">Inicio</Nav.Link>

              {/* DROPDOWN TIENDA */}
              <NavDropdown 
                title="Tienda" 
                id="tienda-nav" 
                show={showTienda}
                onMouseEnter={() => handleMouseEnter('tienda')}
                onMouseLeave={() => handleMouseLeave('tienda')}
                onClick={() => navigate('/catalogo')}
                className="centered-dropdown"
              >
                <NavDropdown.Item onClick={() => irACategoria('/catalogo', '')}>Ver Todo</NavDropdown.Item>
                <NavDropdown.Divider />
                {catsTienda.map(c => (
                  <NavDropdown.Item 
                    key={c.id_categoria} 
                    onClick={(e) => { e.stopPropagation(); irACategoria('/catalogo', c.id_categoria); }}
                  >
                    {c.nombre}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>

              {/* DROPDOWN RESERVA */}
              <NavDropdown 
                title="Reserva" 
                id="reserva-nav"
                show={showReserva}
                onMouseEnter={() => handleMouseEnter('reserva')}
                onMouseLeave={() => handleMouseLeave('reserva')}
                onClick={() => navigate('/reserva')}
                className="centered-dropdown"
              >
                <NavDropdown.Item onClick={() => irACategoria('/reserva', '')}>Ver Barra Completa</NavDropdown.Item>
                <NavDropdown.Divider />
                {catsReserva.map(c => (
                  <NavDropdown.Item 
                    key={c.id_categoria} 
                    onClick={(e) => { e.stopPropagation(); irACategoria('/reserva', c.id_categoria); }}
                  >
                    {c.nombre}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>

              <Nav.Link as={Link} to="/resenas">Reseñas</Nav.Link>
              <Nav.Link as={Link} to="/blog">Blog</Nav.Link>
              <Nav.Link as={Link} to="/contacto">Contacto</Nav.Link>
              
              <Nav.Link as={Link} to="/#visitanos" onClick={scrollToMap}>
                Visítanos
              </Nav.Link>

            </Nav>

            <Nav className="align-items-center gap-3 mt-3 mt-lg-0">
              {user ? (
                <NavDropdown title={<span className="d-inline-flex align-items-center text-coffee fw-bold"><FaUser className="me-2" /> Mi Cuenta</span>} id="user-dropdown" align="end">
                  <NavDropdown.Header className="small text-muted text-center">{user.email?.split('@')[0]}</NavDropdown.Header>
                  <NavDropdown.Item as={Link} to="/mi-cuenta" className="text-center">Perfil y Pedidos</NavDropdown.Item>
                  {role === 'admin' && <NavDropdown.Item as={Link} to="/admin" className="text-center">Panel Admin</NavDropdown.Item>}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={signOut} className="text-danger text-center">Cerrar Sesión</NavDropdown.Item>
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