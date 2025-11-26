import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { Link } from 'react-router-dom';

function Cart() {
  const { cart, getCartTotal, clearCart } = useCart();
  const total = getCartTotal();

  if (cart.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <h2 className="mb-3">Tu carrito está vacío ☕</h2>
        <p className="text-muted mb-4">¡Nuestros baristas están esperando tu pedido!</p>
        <Link to="/catalogo">
          <Button variant="dark" size="lg" className="px-5 rounded-pill">Ir a Comprar</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h2 className="mb-4 fw-bold">Tu Carrito</h2>
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4 border-0">
            <Card.Body>
              {cart.map((item) => (
                <CartItem key={`${item.id_producto}-${item.id_formato}`} item={item} />
              ))}
            </Card.Body>
          </Card>
          <Button variant="outline-danger" onClick={clearCart} className="mb-4">Vaciar Carrito</Button>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm bg-white border-0">
            <Card.Body className="p-4">
              <h4 className="mb-4">Resumen</h4>
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-bold fs-5">Total</span>
                <span className="fw-bold fs-5 text-success">${total.toLocaleString()}</span>
              </div>
              <p className="small text-muted mb-4">El costo de envío se calculará en el siguiente paso.</p>
              <Button variant="dark" className="w-100 py-3 fw-bold" style={{backgroundColor: 'var(--coffee-dark)'}} disabled>
                Ir a Pagar (Próximamente)
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;