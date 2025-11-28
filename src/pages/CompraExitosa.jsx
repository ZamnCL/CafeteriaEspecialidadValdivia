import { Container, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

function CompraExitosa() {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="text-center p-5 shadow-lg border-0 animate-fade-in" style={{ borderRadius: '24px', maxWidth: '500px', backgroundColor: '#fff' }}>
        <Card.Body>
          <div className="mb-4">
            <FaCheckCircle className="text-success" style={{ fontSize: '5rem' }} />
          </div>
          <h2 className="mb-3 fw-bold" style={{ color: 'var(--coffee-dark)' }}>¡Solicitud Recibida!</h2>
          <p className="text-muted mb-4 fs-5">
            Hemos recibido tu comprobante. <br/>
            <span className="fw-bold" style={{ color: 'var(--coffee-light)' }}>En breve recibirás un correo</span> con la confirmación de tu pedido una vez validemos el pago.
          </p>
          <div className="d-grid gap-3">
            <Link to="/mi-cuenta" className="text-decoration-none">
              <Button variant="dark" size="lg" className="w-100 rounded-pill btn-coffee-pill border-0">
                Ver Estado de mi Pedido
              </Button>
            </Link>
            <Link to="/" className="text-decoration-none">
              <Button variant="outline-dark" size="lg" className="w-100 rounded-pill">
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CompraExitosa;