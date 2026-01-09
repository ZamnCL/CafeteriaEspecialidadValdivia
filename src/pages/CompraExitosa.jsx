import { useEffect, useState } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase/cliente';
import { useCart } from '../context/CartContext';
import { FaCheckCircle, FaHome } from 'react-icons/fa';

function CompraExitosa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  
  const status = searchParams.get('status'); // 'approved', 'failure', etc.
  const externalReference = searchParams.get('external_reference'); // ID de la orden
  const paymentId = searchParams.get('payment_id'); // ID de transacción MP

  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const confirmarPago = async () => {
      // Si viene con status 'approved' y tenemos ID de orden, actualizamos
      if (status === 'approved' && externalReference) {
        setProcesando(true);
        
        const { error } = await supabase
          .from('ordenes')
          .update({ 
            estado: 'Pagado', 
            nro_transaccion: paymentId || 'MP_Transaction'
          })
          .eq('id_orden', externalReference);

        if (!error) {
          // Vaciamos carrito solo si todo salió bien
          clearCart();
          setMensaje('¡Pago confirmado exitosamente!');
        } else {
          setMensaje('Pago recibido, pero hubo un error actualizando la orden. Contáctanos.');
        }
        setProcesando(false);
      }
    };

    confirmarPago();
  }, [status, externalReference]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <Card className="text-center shadow p-5 border-0" style={{ maxWidth: '500px' }}>
        <Card.Body>
          {procesando ? (
            <>
              <Spinner animation="border" variant="success" className="mb-3" />
              <h4>Confirmando tu pago...</h4>
              <p>Por favor no cierres esta ventana.</p>
            </>
          ) : (
            <>
              <FaCheckCircle className="text-success mb-3" size={60} />
              <h2 className="mb-3 fw-bold">¡Gracias por tu compra!</h2>
              
              {status === 'approved' && (
                <Alert variant="success">
                    {mensaje || 'Tu pedido ha sido pagado y registrado correctamente.'}
                </Alert>
              )}

              <p className="text-muted">Hemos recibido tu pedido. Te enviaremos un correo con los detalles.</p>
              
              <Button variant="dark" className="mt-3 px-4 rounded-pill" onClick={() => navigate('/')}>
                <FaHome className="me-2" /> Volver al Inicio
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CompraExitosa;