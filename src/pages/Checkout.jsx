import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/cliente';
import { useNavigate } from 'react-router-dom';

function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Estado con RUT y Email
  const [datosEnvio, setDatosEnvio] = useState({
    rut: '',
    email: user?.email || '', // Pre-llenamos con el email del usuario
    direccion: '',
    ciudad: '',
    telefono: ''
  });

  useEffect(() => {
    if (user?.email) {
      setDatosEnvio(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const total = getCartTotal();

  if (cart.length === 0) {
    return <Container className="mt-5 text-center"><h2>El carrito está vacío</h2></Container>;
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e) => {
    setDatosEnvio({ ...datosEnvio, [e.target.name]: e.target.value });
  };

  const procesarCompra = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!datosEnvio.rut || !datosEnvio.email) return setMsg({ type: 'warning', text: 'El RUT y el Email son obligatorios.' });
    if (!datosEnvio.direccion || !datosEnvio.telefono) return setMsg({ type: 'warning', text: 'Completa los datos de envío.' });
    if (!file) return setMsg({ type: 'warning', text: 'Debes subir el comprobante de transferencia.' });

    setLoading(true);
    setMsg({});

    try {
      // 1. Subir Imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicURLData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
      const comprobanteUrl = publicURLData.publicUrl;

      // 2. Crear Orden
      const { data: ordenData, error: ordenError } = await supabase
        .from('ordenes')
        .insert([{
          user_id: user.id,
          nombre: user.user_metadata?.nombre || 'Cliente',
          apellido: user.user_metadata?.apellido || '',
          rut: datosEnvio.rut,
          email_contact: datosEnvio.email,
          email: user.email, 
          telefono: datosEnvio.telefono,
          direccion: datosEnvio.direccion,
          ciudad: datosEnvio.ciudad || 'Valdivia',
          region: 'Los Ríos',
          metodo_pago: 'Transferencia',
          subtotal: total,
          costo_envio: 0,
          total: total,
          estado: 'Por Confirmar',
          comprobante: comprobanteUrl
        }])
        .select()
        .single();

      if (ordenError) throw ordenError;

      // 3. Guardar Detalles
      const detalles = cart.map(item => ({
        id_orden: ordenData.id_orden,
        id_producto: item.id_producto,
        id_formato: item.id_formato,
        cantidad: item.cantidad,
        precio_unitario: item.formato.precio,
        subtotal_item: item.formato.precio * item.cantidad,
        nombre_producto: item.producto.nombre,
        formato_nombre: item.formato.nombre
      }));

      const { error: detallesError } = await supabase.from('detalles_orden').insert(detalles);
      if (detallesError) throw detallesError;

      // 4. Finalizar
      clearCart();
      navigate('/compra-exitosa');

    } catch (error) {
      console.error(error);
      setMsg({ type: 'danger', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-coffee-title">Finalizar Compra</h2>
      {msg.text && <Alert variant={msg.type}>{msg.text}</Alert>}

      <Row>
        <Col md={7}>
          {/* SECCIÓN 1: DATOS DE IDENTIFICACIÓN Y ENVÍO */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">1. Identificación y Envío</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email de Contacto</Form.Label>
                      <Form.Control type="email" name="email" value={datosEnvio.email} onChange={handleInputChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>RUT (Sin puntos ni guión)</Form.Label>
                      <Form.Control type="text" name="rut" placeholder="Ej: 12345678k" value={datosEnvio.rut} onChange={handleInputChange} required />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control type="text" name="direccion" onChange={handleInputChange} placeholder="Calle, Número, Depto" required />
                </Form.Group>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Ciudad</Form.Label>
                      <Form.Control type="text" name="ciudad" onChange={handleInputChange} placeholder="Ej: Valdivia" />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control type="text" name="telefono" onChange={handleInputChange} placeholder="+569..." required />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* SECCIÓN 2: PAGO Y COMPROBANTE */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-warning text-dark fw-bold">2. Pago (Transferencia)</Card.Header>
            <Card.Body>
              <p className="mb-2">Por favor realiza la transferencia a la siguiente cuenta:</p>
              <div className="p-3 bg-light rounded mb-3 border" style={{fontSize: '0.9rem'}}>
                <strong>Banco:</strong> Banco Estado | <strong>Tipo:</strong> Cuenta RUT / Vista<br/>
                <strong>N°:</strong> 12.345.678-9 | <strong>RUT:</strong> 76.543.210-K<br/>
                <strong>Titular:</strong> Café Valdivia SpA | <strong>Email:</strong> pagos@cafevaldivia.cl
              </div>
              
              <Form.Group className="mb-3 border p-3 rounded bg-light">
                <Form.Label className="fw-bold text-coffee-dark">Sube tu comprobante (Screenshot o Foto):</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                <Form.Text className="text-muted small">Tu pedido quedará "Por Confirmar" hasta validar el pago.</Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA LATERAL: RESUMEN */}
        <Col md={5}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-dark text-white fw-bold">Resumen del Pedido</Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {cart.map(item => (
                  <ListGroup.Item key={`${item.id_producto}-${item.id_formato}`} className="d-flex justify-content-between align-items-center px-0">
                    <div>
                      <small className="fw-bold">{item.producto.nombre}</small>
                      <div className="text-muted small">{item.formato.nombre} x {item.cantidad}</div>
                    </div>
                    <span>${(item.formato.precio * item.cantidad).toLocaleString()}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-3">
                <span>Total a Pagar:</span>
                <span className="text-success">${total.toLocaleString()}</span>
              </div>
              
              <Button variant="success" size="lg" className="w-100 mt-4 fw-bold btn-coffee-pill border-0" onClick={procesarCompra} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Finalizar Compra'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Checkout;