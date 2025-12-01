import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { Link } from 'react-router-dom';

function Cart() {
  // Traemos las funciones updateQuantity y removeFromCart del contexto
  const { cart, getCartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const total = getCartTotal();

  if (cart.length === 0) {
    return (
      <Container className="mt-5 text-center" style={{minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <h2 className="mb-3 text-coffee-dark fw-bold">Tu carrito está vacío ☕</h2>
        <p className="text-muted mb-4">¡Nuestros baristas están esperando tu pedido!</p>
        <Link to="/catalogo">
          <Button variant="dark" size="lg" className="px-5 rounded-pill btn-coffee-pill border-0">Ir a la Tienda</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5">
      <h2 className="mb-4 fw-bold text-coffee-dark display-6">Tu Carrito</h2>
      
      <Row className="g-5">
        {/* LISTA DE PRODUCTOS */}
        <Col lg={8}>
          <Card className="shadow-sm mb-4 border-0 overflow-hidden rounded-4">
            <Card.Body className="p-0">
              {cart.map((item, idx) => (
                <CartItem 
                    key={`${item.id_producto}-${item.id_formato}-${idx}`} 
                    item={item}
                    // CORRECCIÓN: Pasamos las funciones al componente hijo
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                />
              ))}
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-start">
            <Button variant="outline-danger" onClick={clearCart} className="rounded-pill px-4 fw-bold">
              Vaciar Carrito
            </Button>
          </div>
        </Col>

        {/* RESUMEN DE COMPRA */}
        <Col lg={4}>
          <Card className="shadow-lg border-0 rounded-4 bg-white sticky-top" style={{top: '100px'}}>
            <Card.Body className="p-4">
              <h4 className="mb-4 fw-bold text-coffee-dark">Resumen</h4>
              
              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Subtotal</span>
                <span>${total.toLocaleString('es-CL')}</span>
              </div>
              <div className="d-flex justify-content-between mb-4 text-muted">
                <span>Envío</span>
                <span className="small fst-italic">Calculado en el siguiente paso</span>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-3 border-top mb-4">
                <span className="fw-bold text-uppercase" style={{ color: '#C9A97E', letterSpacing: '1px' }}>
                  Total
                </span>
                <span className="fw-bold" style={{ color: '#C9A97E', fontSize: '1.8rem' }}>
                  ${total.toLocaleString('es-CL')}
                </span>
              </div>
              
              <Link to="/checkout" className="text-decoration-none w-100 d-block">
                <Button variant="dark" className="w-100 py-3 fw-bold btn-coffee-pill border-0 shadow">
                  Ir a Pagar
                </Button>
              </Link>

              <div className="text-center mt-3">
                <Link to="/catalogo" className="text-muted small text-decoration-underline">
                  Seguir comprando
                </Link>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;