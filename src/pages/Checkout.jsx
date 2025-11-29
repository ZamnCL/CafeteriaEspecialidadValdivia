import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/cliente';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { FaTruck, FaStore } from 'react-icons/fa';

const REGIONES_CHILE = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", 
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", 
  "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [tipoEntrega, setTipoEntrega] = useState('delivery'); 

  const [datosEnvio, setDatosEnvio] = useState({
    rut: '', email: '', direccion: '', ciudad: '', region: '', telefono: ''
  });

  useEffect(() => {
    if (!authLoading && !user) { alert("Debes iniciar sesión."); navigate('/login'); }
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user?.email) setDatosEnvio(prev => ({ ...prev, email: user.email })); }, [user]);

  const totalProductos = getCartTotal();
  const costoEnvio = tipoEntrega === 'retiro' ? 0 : 5000; 
  const totalFinal = totalProductos + costoEnvio;

  if (authLoading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  if (cart.length === 0) return <Container className="mt-5 text-center"><h2>El carrito está vacío</h2></Container>;

  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); };
  const handleInputChange = (e) => { setDatosEnvio({ ...datosEnvio, [e.target.name]: e.target.value }); };

  const enviarNotificacionCorreo = (ordenId) => {
    // ⚠️ PON TUS CLAVES DE EMAILJS AQUÍ SI NO ESTÁN YA
    const serviceID = 'service_94ynerp'; const templateID = 'template_feryfg1'; const publicKey = 'BBJajnSVNxciJjOo3';

    const itemsHtml = cart.map(item => `<tr><td>${item.producto.nombre} (${item.formato.nombre})</td><td style="text-align:center">${item.cantidad}</td><td>$${(item.formato.precio * item.cantidad).toLocaleString()}</td></tr>`).join('');
    const direccionFinal = tipoEntrega === 'retiro' ? 'RETIRO EN TIENDA' : `${datosEnvio.direccion}, ${datosEnvio.ciudad}`;

    const templateParams = {
      to_name: user.user_metadata?.nombre || "Cliente", to_email: datosEnvio.email, order_id: ordenId, total: totalFinal.toLocaleString(), tabla_productos: itemsHtml, customer_address: direccionFinal, customer_phone: datosEnvio.telefono, rut_cliente: datosEnvio.rut, tipo_entrega: tipoEntrega === 'retiro' ? 'Retiro en Tienda' : 'Envío a Domicilio'
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey).catch(err => console.error(err));
  };

  const procesarCompra = async (e) => {
    e.preventDefault();
    if (!datosEnvio.rut || !datosEnvio.email) return setMsg({ type: 'warning', text: 'El RUT y el Email son obligatorios.' });
    if (tipoEntrega === 'delivery' && (!datosEnvio.direccion || !datosEnvio.ciudad || !datosEnvio.region)) return setMsg({ type: 'warning', text: 'Completa la dirección.' });
    if (!file) return setMsg({ type: 'warning', text: 'Sube el comprobante.' });

    setLoading(true); setMsg({});

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicURLData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);

      const { data: ordenData, error: ordenError } = await supabase.from('ordenes').insert([{
          user_id: user.id, nombre: user.user_metadata?.nombre || 'Cliente', apellido: user.user_metadata?.apellido || '', rut: datosEnvio.rut, email_contact: datosEnvio.email, email: user.email, telefono: datosEnvio.telefono,
          direccion: tipoEntrega === 'retiro' ? 'Retiro en Tienda' : datosEnvio.direccion, ciudad: tipoEntrega === 'retiro' ? 'Valdivia' : datosEnvio.ciudad, region: tipoEntrega === 'retiro' ? 'Los Ríos' : datosEnvio.region,
          tipo_entrega: tipoEntrega, metodo_pago: 'Transferencia', subtotal: totalProductos, costo_envio: costoEnvio, total: totalFinal, estado: 'Por Confirmar', comprobante: publicURLData.publicUrl
        }]).select().single();

      if (ordenError) throw ordenError;

      const detalles = cart.map(item => ({ id_orden: ordenData.id_orden, id_producto: item.id_producto, id_formato: item.id_formato, cantidad: item.cantidad, precio_unitario: item.formato.precio, subtotal_item: item.formato.precio * item.cantidad, nombre_producto: item.producto.nombre, formato_nombre: item.formato.nombre }));
      const { error: detallesError } = await supabase.from('detalles_orden').insert(detalles);
      if (detallesError) throw detallesError;

      enviarNotificacionCorreo(ordenData.id_orden);
      clearCart();
      navigate('/compra-exitosa');

    } catch (error) { setMsg({ type: 'danger', text: error.message }); } finally { setLoading(false); }
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-coffee-title">Finalizar Compra</h2>
      {msg.text && <Alert variant={msg.type}>{msg.text}</Alert>}
      <Row>
        <Col md={7}>
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">1. Método de Entrega</Card.Header>
            <Card.Body>
              <div className="d-flex gap-3">
                <Button 
                  // ESTILO MANUAL PARA COINCIDIR CON LA IMAGEN
                  onClick={() => setTipoEntrega('delivery')}
                  className="flex-grow-1 py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: tipoEntrega === 'delivery' ? '#c4a484' : 'white',
                    color: tipoEntrega === 'delivery' ? 'white' : '#5c3d2e',
                    border: '2px solid #c4a484',
                    borderRadius: '50px'
                  }}
                >
                  <FaTruck className="me-2"/> Envío Bluexpress
                </Button>
                <Button 
                  onClick={() => setTipoEntrega('retiro')}
                  className="flex-grow-1 py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: tipoEntrega === 'retiro' ? '#c4a484' : 'white',
                    color: tipoEntrega === 'retiro' ? 'white' : '#5c3d2e',
                    border: '2px solid #c4a484',
                    borderRadius: '50px'
                  }}
                >
                  <FaStore className="me-2"/> Retiro en Tienda
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">2. Datos de Contacto {tipoEntrega === 'delivery' ? 'y Envío' : ''}</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={datosEnvio.email} onChange={handleInputChange} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>RUT</Form.Label><Form.Control type="text" name="rut" placeholder="Ej: 12345678k" value={datosEnvio.rut} onChange={handleInputChange} required /></Form.Group></Col>
                </Row>
                <Row><Col><Form.Group className="mb-3"><Form.Label>Teléfono</Form.Label><Form.Control type="text" name="telefono" onChange={handleInputChange} required placeholder="+56 9..." /></Form.Group></Col></Row>
                {tipoEntrega === 'delivery' && (
                  <div className="animate-fade-in">
                    <hr className="my-4"/>
                    <h6 className="text-muted mb-3">Dirección de Envío</h6>
                    <Row>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Región</Form.Label><Form.Select name="region" value={datosEnvio.region} onChange={handleInputChange}><option value="">Selecciona...</option>{REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}</Form.Select></Form.Group></Col>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Ciudad</Form.Label><Form.Control type="text" name="ciudad" onChange={handleInputChange} /></Form.Group></Col>
                    </Row>
                    <Form.Group className="mb-3"><Form.Label>Dirección</Form.Label><Form.Control type="text" name="direccion" onChange={handleInputChange} required /></Form.Group>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-warning text-dark fw-bold">3. Pago</Card.Header>
            <Card.Body>
              <div className="p-3 bg-light rounded mb-3 border small">
                <strong>Banco:</strong> Banco Estado | <strong>Tipo:</strong> Cuenta RUT / Vista<br/>
                <strong>N°:</strong> 12.345.678-9 | <strong>RUT:</strong> 76.543.210-K<br/>
                <strong>Titular:</strong> Café Valdivia SpA | <strong>Email:</strong> pagos@cafevaldivia.cl
              </div>
              <Form.Group className="mb-3 border p-3 rounded bg-light">
                <Form.Label className="fw-bold">Comprobante:</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-dark text-white fw-bold">Resumen</Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {cart.map((item, idx) => (<ListGroup.Item key={idx} className="d-flex justify-content-between px-0"><div><small className="fw-bold">{item.producto.nombre}</small><div className="text-muted small">{item.formato.nombre} x {item.cantidad}</div></div><span>${(item.formato.precio * item.cantidad).toLocaleString()}</span></ListGroup.Item>))}
              </ListGroup>
              <div className="d-flex justify-content-between small text-muted mb-2"><span>Subtotal:</span><span>${totalProductos.toLocaleString()}</span></div>
              <div className="d-flex justify-content-between small text-muted mb-3 border-bottom pb-3"><span>Envío:</span><span>{costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toLocaleString()}`}</span></div>
              <div className="d-flex justify-content-between fw-bold fs-4"><span>Total:</span><span className="text-success">${totalFinal.toLocaleString()}</span></div>
              <Button variant="success" size="lg" className="w-100 mt-4 fw-bold btn-coffee-pill border-0" onClick={procesarCompra} disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : 'Finalizar Compra'}</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
export default Checkout;