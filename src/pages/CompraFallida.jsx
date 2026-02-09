import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaHome, FaRedo } from 'react-icons/fa';

function CompraFallida() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  const getMensaje = () => {
    switch(status) {
      case 'rejected':
        return 'El pago fue rechazado. Por favor, verifica tus datos e intenta nuevamente.';
      case 'pending':
        return 'El pago está pendiente de confirmación. Te notificaremos cuando se procese.';
      default:
        return 'No se pudo completar el pago. Por favor, intenta nuevamente.';
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center mt-5">
      <Card className="text-center shadow p-5 border-0" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <FaTimesCircle className="text-danger display-1 mb-3"/>
          <h2 className="mb-3">Pago no completado</h2>
          <Alert variant="warning" className="mb-4">
            {getMensaje()}
          </Alert>
          
          {externalReference && (
            <p className="text-muted mb-4">
              Número de orden: <strong>{externalReference}</strong>
            </p>
          )}

          <div className="d-flex gap-3 justify-content-center">
            <Button 
              variant="primary" 
              onClick={() => navigate('/mi-cuenta')}
              className="d-flex align-items-center gap-2"
            >
              <FaRedo /> Reintentar pago
            </Button>
            <Button 
              variant="outline-dark" 
              onClick={() => navigate('/')}
              className="d-flex align-items-center gap-2"
            >
              <FaHome /> Volver al inicio
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CompraFallida;
