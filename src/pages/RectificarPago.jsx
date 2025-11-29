import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/cliente';

function RectificarPago() {
  const { idOrden } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [orden, setOrden] = useState(null);

  useEffect(() => {
    // Verificar que la orden exista y necesite rectificación
    const fetchOrden = async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .eq('id_orden', idOrden)
        .single();
      
      if (error || !data) {
        setMsg({ type: 'danger', text: 'Orden no encontrada.' });
      } else if (data.estado !== 'Rechazado') {
        setMsg({ type: 'info', text: 'Esta orden no requiere rectificación actualmente.' });
      } else {
        setOrden(data);
      }
    };
    fetchOrden();
  }, [idOrden]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMsg({ type: 'warning', text: 'Debes seleccionar una imagen.' });

    setLoading(true);
    try {
      // 1. Subir nueva imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `rectificado_${idOrden}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: publicURLData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);

      // 2. Actualizar Orden: Nuevo comprobante y estado a "Por Confirmar"
      const { error: updateError } = await supabase
        .from('ordenes')
        .update({
          comprobante: publicURLData.publicUrl,
          estado: 'Por Confirmar' // <--- Vuelve a la cola de pendientes
        })
        .eq('id_orden', idOrden);

      if (updateError) throw updateError;

      setMsg({ type: 'success', text: '¡Comprobante enviado! Lo revisaremos nuevamente.' });
      setTimeout(() => navigate('/mi-cuenta'), 3000);

    } catch (error) {
      setMsg({ type: 'danger', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!orden && !msg.text) return <Container className="mt-5 text-center"><Spinner animation="border"/></Container>;

  return (
    <Container className="d-flex justify-content-center align-items-center my-5" style={{ minHeight: '60vh' }}>
      <Card className="shadow-lg border-0" style={{ width: '500px' }}>
        <Card.Header className="bg-danger text-white fw-bold text-center">
          Corregir Comprobante - Orden #{idOrden}
        </Card.Header>
        <Card.Body className="p-4">
          <p className="text-center text-muted mb-4">
            Tu comprobante anterior fue rechazado. Por favor, sube una nueva captura clara de la transferencia.
          </p>

          {msg.text && <Alert variant={msg.type}>{msg.text}</Alert>}

          {orden && (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Nuevo Comprobante:</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} required />
              </Form.Group>
              <Button variant="dark" type="submit" className="w-100 btn-coffee-pill" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm"/> : 'Enviar Corrección'}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RectificarPago;