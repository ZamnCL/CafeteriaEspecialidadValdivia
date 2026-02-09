import { useEffect, useState } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase/cliente';
import { useCart } from '../context/CartContext';
import { FaCheckCircle, FaHome, FaExclamationTriangle } from 'react-icons/fa';

function CompraExitosa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  
  // Mercado Pago devuelve estos parámetros en la URL
  const status = searchParams.get('status') || searchParams.get('collection_status'); 
  const externalReference = searchParams.get('external_reference'); 
  const paymentId = searchParams.get('payment_id');

  const [procesando, setProcesando] = useState(true);
  const [resultado, setResultado] = useState({ exito: false, mensaje: '' });

  useEffect(() => {
    const finalizarCompra = async () => {
      if (status === 'approved' && externalReference) {
        try {
          // 1. Evitar duplicados revisando si ya está pagada
          const { data: ordenActual } = await supabase
            .from('ordenes')
            .select('estado')
            .eq('id_orden', externalReference)
            .single();

          if (ordenActual?.estado === 'Pagado') {
             setResultado({ exito: true, mensaje: 'Pedido ya confirmado.' });
             setProcesando(false);
             return; 
          }

          // 2. Marcar como PAGADO
          await supabase.from('ordenes')
            .update({ estado: 'Pagado', nro_transaccion: paymentId })
            .eq('id_orden', externalReference);

          // 3. DESCONTAR STOCK (Llamada a la función SQL)
          // Si no tienes esta función SQL creada en tu base de datos nueva, avísame.
          await supabase.rpc('descontar_stock_orden', { id_orden_input: externalReference });

          clearCart();
          setResultado({ exito: true, mensaje: '¡Pago acreditado y stock actualizado!' });

        } catch (error) {
          console.error(error);
          setResultado({ exito: false, mensaje: 'Hubo un error guardando el pedido.' });
        }
      } else {
        setResultado({ exito: false, mensaje: 'El pago no fue aprobado.' });
      }
      setProcesando(false);
    };

    finalizarCompra();
  }, [status, externalReference]);

  return (
    <Container className="d-flex justify-content-center align-items-center mt-5">
      <Card className="text-center shadow p-5 border-0">
        <Card.Body>
          {procesando ? (
            <Spinner animation="border" />
          ) : (
            <>
              {resultado.exito ? <FaCheckCircle className="text-success display-1 mb-3"/> : <FaExclamationTriangle className="text-warning display-1 mb-3"/>}
              <h2>{resultado.exito ? '¡Compra Exitosa!' : 'Algo salió mal'}</h2>
              <p>{resultado.mensaje}</p>
              <Button variant="dark" onClick={() => navigate('/')}>Volver al Inicio</Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CompraExitosa;