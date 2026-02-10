import { Container, Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { Link } from 'react-router-dom';
import { FaShippingFast, FaLock } from 'react-icons/fa';

function Cart() {
  const { cart, getCartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const total = getCartTotal();

  const envioGratisMinimo = 40000;
  const faltaParaEnvioGratis = Math.max(0, envioGratisMinimo - total);
  const porcentajeEnvioGratis = Math.min(100, (total / envioGratisMinimo) * 100);

  if (cart.length === 0) {
    return (
      <Container className="mt-5 text-center" style={{minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div className="mb-4">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h2 className="mb-3 fw-bold" style={{color: '#2c2c2c', fontSize: '2rem'}}>Tu carrito está vacío</h2>
        <p className="text-muted mb-5" style={{fontSize: '1.1rem'}}>Descubre nuestros cafés especiales y comienza tu experiencia</p>
        <Link to="/catalogo">
          <Button
            variant="dark"
            size="lg"
            className="px-5 py-3 fw-bold"
            style={{
              backgroundColor: '#2c2c2c',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
          >
            EXPLORAR PRODUCTOS
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5" style={{maxWidth: '1400px'}}>
      <div className="mb-5">
        <h1 className="mb-2 fw-bold" style={{color: '#2c2c2c', fontSize: '2.5rem', letterSpacing: '-0.5px'}}>
          Carrito de Compras
        </h1>
        <p className="text-muted" style={{fontSize: '1rem'}}>
          {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          {faltaParaEnvioGratis > 0 && (
            <Card className="mb-4 border-0 shadow-sm" style={{borderRadius: '12px', overflow: 'hidden'}}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <FaShippingFast size={24} className="text-success me-3" />
                  <div className="flex-grow-1">
                    <p className="mb-1 fw-bold" style={{color: '#2c2c2c', fontSize: '0.95rem'}}>
                      ¡Te faltan ${faltaParaEnvioGratis.toLocaleString('es-CL')} para envío gratis!
                    </p>
                    <ProgressBar
                      now={porcentajeEnvioGratis}
                      style={{height: '8px', borderRadius: '10px'}}
                      className="bg-light"
                    >
                      <ProgressBar
                        now={porcentajeEnvioGratis}
                        style={{backgroundColor: '#4CAF50', borderRadius: '10px'}}
                      />
                    </ProgressBar>
                  </div>
                </div>
                <p className="text-muted mb-0 small">
                  Envío gratis en compras sobre ${envioGratisMinimo.toLocaleString('es-CL')}
                </p>
              </Card.Body>
            </Card>
          )}

          {porcentajeEnvioGratis >= 100 && (
            <Card className="mb-4 border-0 shadow-sm" style={{borderRadius: '12px', backgroundColor: '#f0f9f4'}}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <FaShippingFast size={24} className="text-success me-3" />
                  <div>
                    <p className="mb-0 fw-bold text-success" style={{fontSize: '1rem'}}>
                      ¡Felicitaciones! Tienes envío gratis 🎉
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          <Card className="border-0 shadow-sm mb-4" style={{borderRadius: '12px'}}>
            <Card.Body className="p-0">
              {cart.map((item, idx) => (
                <div
                  key={`${item.id_producto}-${item.id_formato}-${idx}`}
                  style={{
                    borderBottom: idx < cart.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <CartItem
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <Link to="/catalogo" className="text-decoration-none">
              <Button
                variant="link"
                className="text-dark p-0 fw-semibold"
                style={{fontSize: '0.95rem'}}
              >
                ← Seguir comprando
              </Button>
            </Link>
            <Button
              variant="link"
              onClick={clearCart}
              className="text-danger p-0 fw-semibold"
              style={{fontSize: '0.95rem'}}
            >
              Vaciar carrito
            </Button>
          </div>
        </Col>

        <Col lg={4}>
          <div className="sticky-top" style={{top: '100px'}}>
            <Card className="border-0 shadow-lg" style={{borderRadius: '16px', overflow: 'hidden'}}>
              <Card.Body className="p-4">
                <h4 className="mb-4 fw-bold" style={{color: '#2c2c2c', fontSize: '1.5rem'}}>
                  Resumen del Pedido
                </h4>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-3">
                    <span style={{color: '#666', fontSize: '1rem'}}>Subtotal</span>
                    <span className="fw-semibold" style={{color: '#2c2c2c', fontSize: '1rem'}}>
                      ${total.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span style={{color: '#666', fontSize: '1rem'}}>Envío</span>
                    <span style={{color: '#666', fontSize: '0.9rem', fontStyle: 'italic'}}>
                      {porcentajeEnvioGratis >= 100 ? 'Gratis' : 'A calcular'}
                    </span>
                  </div>
                </div>

                <div
                  className="d-flex justify-content-between align-items-center py-3 mb-4"
                  style={{borderTop: '2px solid #f0f0f0', borderBottom: '2px solid #f0f0f0'}}
                >
                  <span className="fw-bold text-uppercase" style={{color: '#2c2c2c', fontSize: '1.1rem', letterSpacing: '1px'}}>
                    Total
                  </span>
                  <span className="fw-bold" style={{color: '#2c2c2c', fontSize: '2rem'}}>
                    ${total.toLocaleString('es-CL')}
                  </span>
                </div>

                <Link to="/checkout" className="text-decoration-none w-100 d-block mb-3">
                  <Button
                    className="w-100 py-3 fw-bold border-0"
                    style={{
                      backgroundColor: '#2c2c2c',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      letterSpacing: '0.5px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    FINALIZAR COMPRA
                  </Button>
                </Link>

                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center text-muted small">
                    <FaLock className="me-2" size={12} />
                    <span style={{fontSize: '0.85rem'}}>Pago seguro con Mercado Pago</span>
                  </div>
                </div>

              </Card.Body>
            </Card>

            <Card className="border-0 mt-4" style={{borderRadius: '12px', backgroundColor: '#f8f9fa'}}>
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3" style={{color: '#2c2c2c', fontSize: '0.95rem'}}>
                  BENEFICIOS DE COMPRAR CON NOSOTROS
                </h6>
                <ul className="list-unstyled mb-0" style={{fontSize: '0.85rem', color: '#666'}}>
                  <li className="mb-2">✓ Envío gratis sobre $40.000</li>
                  <li className="mb-2">✓ Hasta 3 cuotas sin interés</li>
                  <li className="mb-2">✓ Café fresco y de especialidad</li>
                  <li className="mb-0">✓ Atención personalizada</li>
                </ul>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;