import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/cliente';
import { useNavigate, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { FaTruck, FaStore, FaInfoCircle, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const REGIONES_CHILE = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", 
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", 
  "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

// Algoritmo de validación de RUT chileno
const validarRut = (rut) => {
  if (!rut) return false;
  const valor = rut.replace(/[^0-9kK]/g, '').toLowerCase();
  if (valor.length < 8 || valor.length > 9) return false;
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1);
  if (!/^[0-9]+$/.test(cuerpo)) return false;
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    if (multiplo < 7) multiplo += 1; else multiplo = 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvFinal = (dvEsperado === 11) ? '0' : (dvEsperado === 10) ? 'k' : dvEsperado.toString();
  return dv === dvFinal;
};

function Checkout() {
  const { cart, clearCart, removeFromCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- LÓGICA HÍBRIDA: ¿Compra Directa o Carrito? ---
  // Si venimos de "Comprar Ahora", usamos ese item. Si no, usamos el carrito global.
  const itemsCompraDirecta = location.state?.compraDirecta;
  const itemsAProcesar = itemsCompraDirecta || cart;
  const esCompraDirecta = !!itemsCompraDirecta;
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [tipoEntrega, setTipoEntrega] = useState('delivery'); 
  const [erroresStock, setErroresStock] = useState({});

  const [datosEnvio, setDatosEnvio] = useState({
    rut: '', email: '', direccion: '', ciudad: '', region: ''
  });
  
  // Estado exclusivo para los 8 dígitos del teléfono
  const [telefonoInput, setTelefonoInput] = useState('');

  const tienePreparaciones = itemsAProcesar.some(item => item.reserva);

  useEffect(() => {
    if (tienePreparaciones) { setTipoEntrega('retiro'); }
  }, [tienePreparaciones]);

  useEffect(() => {
    if (!authLoading && !user) { alert("Debes iniciar sesión."); navigate('/login'); }
  }, [user, authLoading, navigate]);

  useEffect(() => { 
    if (user?.email) setDatosEnvio(prev => ({ ...prev, email: user.email })); 
  }, [user]);

  useEffect(() => { setErroresStock({}); }, [itemsAProcesar]);

  // Calcular total dinámico
  const totalProductos = itemsAProcesar.reduce((acc, item) => {
      const precio = item.formato?.precio || 0;
      return acc + (precio * item.cantidad);
  }, 0);
  
  const costoEnvio = tipoEntrega === 'retiro' ? 0 : 5000; 
  const totalFinal = totalProductos + costoEnvio;

  if (authLoading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  if (itemsAProcesar.length === 0) return <Container className="mt-5 text-center"><h2>No hay productos para procesar</h2></Container>;

  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); };
  const handleInputChange = (e) => { setDatosEnvio({ ...datosEnvio, [e.target.name]: e.target.value }); };
  
  const handleRutChange = (e) => { 
    let val = e.target.value.replace(/[^0-9kK]/g, ''); 
    if (val.length > 9) return; 
    setDatosEnvio({ ...datosEnvio, rut: val }); 
  };

  // Manejador para solo aceptar números y máximo 8 dígitos
  const handleTelefonoChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) return;
    setTelefonoInput(val);
  };

  const enviarNotificacionCorreo = (ordenId) => {
    const serviceID = 'service_94ynerp'; 
    const templateID = 'template_feryfg1'; 
    const publicKey = 'BBJajnSVNxciJjOo3';
    
    const itemsHtml = itemsAProcesar.map(item => {
        const nombreProd = item.producto?.nombre || "Producto";
        const nombreFmt = item.formato?.nombre || "N/A";
        const precioItem = item.formato?.precio || 0;
        const reservaTexto = item.reserva ? `<br/><span style="color:#c4a484; font-size:12px;">(Retiro: ${item.reserva.time})</span>` : '';
        
        return `<tr><td>${nombreProd} ${reservaTexto} (${nombreFmt})</td><td style="text-align:center">${item.cantidad}</td><td>$${(precioItem * item.cantidad).toLocaleString('es-CL')}</td></tr>`;
    }).join('');

    const direccionFinal = tipoEntrega === 'retiro' ? 'RETIRO EN TIENDA' : `${datosEnvio.direccion}, ${datosEnvio.ciudad}, ${datosEnvio.region}`;
    // Usamos nombre del perfil o del correo
    const nombreCliente = user.user_metadata?.nombre || user.email?.split('@')[0] || "Cliente";
    const telefonoCompleto = `+56 9 ${telefonoInput}`;

    const templateParams = {
      to_name: nombreCliente,
      to_email: datosEnvio.email, 
      order_id: ordenId, 
      total: totalFinal.toLocaleString('es-CL'), 
      tabla_productos: itemsHtml, 
      customer_address: direccionFinal, 
      customer_phone: telefonoCompleto, 
      rut_cliente: datosEnvio.rut, 
      tipo_entrega: tipoEntrega === 'retiro' ? 'Retiro en Tienda' : 'Envío a Domicilio'
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey).catch(err => console.error(err));
  };

  const procesarCompra = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setErroresStock({});

    if (!datosEnvio.rut || !validarRut(datosEnvio.rut)) return setMsg({ type: 'warning', text: 'RUT inválido.' });
    if (!datosEnvio.email) return setMsg({ type: 'warning', text: 'Email obligatorio.' });
    
    // Validación estricta de teléfono (8 dígitos)
    if (!telefonoInput || telefonoInput.length < 8) return setMsg({ type: 'warning', text: 'Ingresa un teléfono válido (8 dígitos).' });
    
    if (tipoEntrega === 'delivery' && (!datosEnvio.direccion || !datosEnvio.ciudad || !datosEnvio.region)) {
      return setMsg({ type: 'warning', text: 'Dirección incompleta.' });
    }
    if (!file) return setMsg({ type: 'warning', text: 'Sube el comprobante.' });

    setLoading(true);

    try {
      // 1. VALIDACIÓN DE STOCK
      const nuevosErrores = {};
      let hayErrorStock = false;

      for (const item of itemsAProcesar) {
        // Solo validamos stock si NO es una reserva (las reservas usan stock infinito/cupos)
        if (!item.reserva) { 
            const { data: formatoDb, error: stockError } = await supabase
              .from('formatos')
              .select('stock')
              .eq('id_formato', item.id_formato)
              .single();
            
            if (stockError || !formatoDb) {
                nuevosErrores[`${item.id_producto}-${item.id_formato}`] = "Error verificando stock.";
                hayErrorStock = true;
            } else if (formatoDb.stock < item.cantidad) {
                nuevosErrores[`${item.id_producto}-${item.id_formato}`] = `Solo quedan ${formatoDb.stock}.`;
                hayErrorStock = true;
            }
        }
      }

      if (hayErrorStock) {
          setErroresStock(nuevosErrores);
          setLoading(false);
          return setMsg({ type: 'danger', text: 'Stock insuficiente. Revisa los ítems marcados.' });
      }

      // 2. SUBIR COMPROBANTE
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicURLData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);

      // 3. CREAR ORDEN (Concatenando teléfono)
      const telefonoCompleto = `+56 9 ${telefonoInput}`;
      
      const { data: ordenData, error: ordenError } = await supabase.from('ordenes').insert([{
          user_id: user.id, 
          nombre: user.user_metadata?.nombre || 'Cliente', 
          apellido: user.user_metadata?.apellido || '', 
          rut: datosEnvio.rut, 
          email_contact: datosEnvio.email, 
          email: user.email, 
          telefono: telefonoCompleto,
          direccion: tipoEntrega === 'retiro' ? 'Retiro en Tienda' : datosEnvio.direccion, 
          ciudad: tipoEntrega === 'retiro' ? 'Valdivia' : datosEnvio.ciudad, 
          region: tipoEntrega === 'retiro' ? 'Los Ríos' : datosEnvio.region,
          tipo_entrega: tipoEntrega, 
          metodo_pago: 'Transferencia', 
          subtotal: totalProductos, 
          costo_envio: costoEnvio, 
          total: totalFinal, 
          estado: 'Por Confirmar', 
          comprobante: publicURLData.publicUrl
        }]).select().single();

      if (ordenError) throw ordenError;

      // 4. GUARDAR DETALLES
      const detalles = itemsAProcesar.map(item => ({ 
          id_orden: ordenData.id_orden, 
          id_producto: item.id_producto, 
          id_formato: item.id_formato, 
          cantidad: item.cantidad, 
          precio_unitario: item.formato?.precio || 0, 
          subtotal_item: (item.formato?.precio || 0) * item.cantidad, 
          nombre_producto: item.producto?.nombre || "Producto", 
          formato_nombre: item.formato?.nombre || "Estándar", 
          datos_reserva: item.reserva 
      }));

      const { error: detallesError } = await supabase.from('detalles_orden').insert(detalles);
      if (detallesError) throw detallesError;

      enviarNotificacionCorreo(ordenData.id_orden);
      
      // Solo vaciamos el carrito si fue una compra normal. 
      // Si fue "Compra Directa", el carrito original sigue intacto.
      if (!esCompraDirecta) {
          clearCart();
      }
      
      navigate('/compra-exitosa');

    } catch (error) { 
        setMsg({ type: 'danger', text: error.message }); 
        setLoading(false); 
    }
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-coffee-title">{esCompraDirecta ? 'Compra Rápida' : 'Finalizar Compra'}</h2>
      
      {msg.text && <Alert variant={msg.type} className="animate-fade-in shadow-sm">{msg.text}</Alert>}
      
      {tienePreparaciones && (
        <Alert variant="warning" className="d-flex align-items-center mb-4 border-0 shadow-sm">
          <FaInfoCircle className="me-3 fs-4" />
          <div><strong>Contiene preparaciones.</strong><div className="small">Solo retiro en tienda.</div></div>
        </Alert>
      )}

      <Row>
        <Col md={7}>
          {/* SECCIÓN 1: MÉTODO DE ENTREGA */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">1. Método de Entrega</Card.Header>
            <Card.Body>
              <div className="d-flex gap-3">
                <Button 
                  onClick={() => !tienePreparaciones && setTipoEntrega('delivery')} 
                  className="flex-grow-1 py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center" 
                  disabled={tienePreparaciones} 
                  style={{
                    backgroundColor: tipoEntrega === 'delivery' ? '#c4a484' : 'white', 
                    color: tipoEntrega === 'delivery' ? 'white' : (tienePreparaciones ? '#ccc' : '#5c3d2e'), 
                    border: `2px solid ${tienePreparaciones ? '#eee' : '#c4a484'}`, 
                    borderRadius: '50px', 
                    opacity: tienePreparaciones ? 0.6 : 1, 
                    cursor: tienePreparaciones ? 'not-allowed' : 'pointer'
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

          {/* SECCIÓN 2: DATOS CONTACTO */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">2. Datos de Contacto</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" name="email" value={datosEnvio.email} onChange={handleInputChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>RUT</Form.Label>
                      <Form.Control type="text" name="rut" placeholder="12345678k" value={datosEnvio.rut} onChange={handleRutChange} required />
                      <Form.Text className="text-muted">Ej: 18555333k</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                        <Form.Label>Teléfono</Form.Label>
                        <div className="d-flex">
                            <span className="input-group-text border-end-0 rounded-start" style={{backgroundColor: '#e9ecef', fontWeight: 'bold'}}>+56 9</span>
                            <Form.Control 
                                className="border-start-0 rounded-end"
                                type="text" 
                                placeholder="12345678" 
                                value={telefonoInput} 
                                onChange={handleTelefonoChange} 
                                required 
                            />
                        </div>
                    </Form.Group>
                  </Col>
                </Row>

                {tipoEntrega === 'delivery' && (
                  <div className="animate-fade-in">
                    <hr className="my-4"/><h6 className="text-muted mb-3">Dirección de Envío</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Región</Form.Label>
                          <Form.Select name="region" value={datosEnvio.region} onChange={handleInputChange}>
                            <option value="">Selecciona...</option>
                            {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ciudad</Form.Label>
                          <Form.Control type="text" name="ciudad" onChange={handleInputChange} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Dirección</Form.Label>
                      <Form.Control type="text" name="direccion" onChange={handleInputChange} required />
                    </Form.Group>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
          
          {/* SECCIÓN 3: PAGO */}
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
          {/* RESUMEN DE COMPRA */}
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-dark text-white fw-bold">Resumen ({itemsAProcesar.length} prod.)</Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {itemsAProcesar.map((item, idx) => {
                    const errorKey = `${item.id_producto}-${item.id_formato}`;
                    const error = erroresStock[errorKey];
                    
                    const nombreProd = item.producto?.nombre || "Producto";
                    const nombreFmt = item.formato?.nombre || "N/A";
                    const precioFmt = item.formato?.precio || 0;

                    return (
                        <ListGroup.Item 
                            key={idx} 
                            className={`d-flex flex-column px-0 ${error ? 'bg-danger-subtle p-2 rounded mb-2 border border-danger' : ''}`}
                        >
                            <div className="d-flex justify-content-between w-100">
                                <div>
                                    <small className="fw-bold">{nombreProd}</small>
                                    <div className="text-muted small">{nombreFmt} x {item.cantidad}
                                        {item.reserva && <span className="d-block text-warning fw-bold">Retiro: {item.reserva.time}</span>}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <span>${(precioFmt * item.cantidad).toLocaleString('es-CL')}</span>
                                    {/* Botón eliminar solo si NO es compra directa (para no romper lógica de navegación) */}
                                    {!esCompraDirecta && (
                                      <Button 
                                        variant="link" 
                                        className="text-danger p-0 ms-2 align-top" 
                                        size="sm" 
                                        onClick={() => removeFromCart(item.id_producto, item.id_formato, item.reserva)} 
                                        title="Quitar"
                                      >
                                        <FaTrash size={12}/>
                                      </Button>
                                    )}
                                </div>
                            </div>
                            {error && (
                                <div className="text-danger small mt-2 d-flex align-items-center fw-bold">
                                    <FaExclamationTriangle className="me-2"/> {error}
                                </div>
                            )}
                        </ListGroup.Item>
                    );
                })}
              </ListGroup>

              <div className="d-flex justify-content-between small text-muted mb-2"><span>Subtotal:</span><span>${totalProductos.toLocaleString('es-CL')}</span></div>
              <div className="d-flex justify-content-between small text-muted mb-3 border-bottom pb-3"><span>Envío:</span><span>{costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toLocaleString('es-CL')}`}</span></div>
              
              <div className="d-flex justify-content-between align-items-center pt-2">
                <span className="fw-bold text-uppercase" style={{ color: '#C9A97E', letterSpacing: '1px' }}>Total Pedido:</span>
                <span className="fw-bold" style={{ color: '#C9A97E', fontSize: '1.5rem' }}>${totalFinal.toLocaleString('es-CL')}</span>
              </div>
              
              <Button 
                variant="success" 
                size="lg" 
                className="w-100 mt-4 fw-bold btn-coffee-pill border-0" 
                onClick={procesarCompra} 
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Finalizar Compra'}
              </Button>

              {esCompraDirecta && (
                <Button variant="link" className="w-100 mt-2 text-muted text-decoration-none small" onClick={() => navigate(-1)}>
                  Cancelar y volver
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Checkout;