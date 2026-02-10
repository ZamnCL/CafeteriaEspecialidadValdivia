import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/cliente';
import { useNavigate, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { FaTruck, FaStore, FaInfoCircle, FaCreditCard, FaCheckCircle, FaLock } from 'react-icons/fa';

const REGIONES_CHILE = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío",
  "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

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

  const itemsCompraDirecta = location.state?.compraDirecta;
  const itemsAProcesar = itemsCompraDirecta || cart;
  const esCompraDirecta = !!itemsCompraDirecta;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [tipoEntrega, setTipoEntrega] = useState('delivery');
  const [metodoPago, setMetodoPago] = useState('webpay');
  const [erroresStock, setErroresStock] = useState({});

  const [datosEnvio, setDatosEnvio] = useState({
    rut: '', email: '', direccion: '', ciudad: '', region: ''
  });

  const [telefonoInput, setTelefonoInput] = useState('');

  const tienePreparaciones = itemsAProcesar.some(item => {
    if (item.reserva) return true;
    const nombreCategoria = item.producto?.categoria?.nombre?.toLowerCase() || '';
    const palabrasClave = ['preparaci', 'filtrado', 'bebida', 'cafeteria', 'servir'];
    return palabrasClave.some(palabra => nombreCategoria.includes(palabra));
  });

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
        return `<tr><td>${nombreProd} (${nombreFmt})</td><td style="text-align:center">${item.cantidad}</td><td>$${(precioItem * item.cantidad).toLocaleString('es-CL')}</td></tr>`;
    }).join('');

    const direccionFinal = tipoEntrega === 'retiro' ? 'RETIRO EN TIENDA' : `${datosEnvio.direccion}, ${datosEnvio.ciudad}, ${datosEnvio.region}`;
    const nombreCliente = user.user_metadata?.nombre || user.email?.split('@')[0] || "Cliente";

    emailjs.send(serviceID, templateID, {
      to_name: nombreCliente,
      to_email: datosEnvio.email,
      order_id: ordenId,
      total: totalFinal.toLocaleString('es-CL'),
      tabla_productos: itemsHtml,
      customer_address: direccionFinal,
      customer_phone: `+56 9 ${telefonoInput}`,
      rut_cliente: datosEnvio.rut,
      tipo_entrega: tipoEntrega
    }, publicKey).catch(err => console.error('Error email:', err));
  };

  const procesarCompra = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setErroresStock({});

    if (!datosEnvio.rut || !validarRut(datosEnvio.rut)) return setMsg({ type: 'warning', text: 'RUT inválido.' });
    if (!datosEnvio.email) return setMsg({ type: 'warning', text: 'Email obligatorio.' });
    if (!telefonoInput || telefonoInput.length < 8) return setMsg({ type: 'warning', text: 'Teléfono inválido (8 dígitos).' });
    if (tipoEntrega === 'delivery' && (!datosEnvio.direccion || !datosEnvio.ciudad || !datosEnvio.region)) {
      return setMsg({ type: 'warning', text: 'Dirección incompleta.' });
    }

    setLoading(true);

    try {
      const nuevosErrores = {};
      let hayErrorStock = false;
      for (const item of itemsAProcesar) {
        if (!item.reserva) {
            const { data: formatoDb, error: stockError } = await supabase
              .from('formatos')
              .select('stock')
              .eq('id_formato', item.id_formato)
              .single();

            if (stockError) {
                console.error("Error consultando stock:", stockError);
                throw new Error("Error verificando disponibilidad de productos.");
            }

            if (!formatoDb || formatoDb.stock < item.cantidad) {
                nuevosErrores[`${item.id_producto}-${item.id_formato}`] = `Stock insuficiente (Quedan: ${formatoDb?.stock || 0})`;
                hayErrorStock = true;
            }
        }
      }

      if (hayErrorStock) {
          setErroresStock(nuevosErrores);
          setLoading(false);
          return setMsg({ type: 'danger', text: 'Hay productos sin stock suficiente.' });
      }

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
          metodo_pago: 'webpay',
          subtotal: totalProductos,
          costo_envio: costoEnvio,
          total: totalFinal,
          estado: 'Pendiente Pago',
          comprobante: null
        }]).select().single();

      if (ordenError) {
          console.error("Error creando orden:", ordenError);
          throw new Error("Error al crear la orden en base de datos.");
      }

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

      console.log("Iniciando función Mercado Pago...");
      const { data: responseData, error: funcError } = await supabase.functions.invoke('mercado_pago', {
         body: {
           items: itemsAProcesar,
           orderId: ordenData.id_orden,
           userEmail: datosEnvio.email
         }
       });

       if (funcError) {
           console.error("Error Edge Function:", funcError);
           throw new Error(`Error conectando con Mercado Pago: ${funcError.message}`);
       }

       if (responseData?.init_point) {
         window.location.href = responseData.init_point;
       } else {
         console.error("Respuesta MP inválida:", responseData);
         throw new Error('Mercado Pago no devolvió el link de pago.');
       }

    } catch (error) {
        console.error("Error en proceso compra:", error);
        setMsg({ type: 'danger', text: error.message });
        setLoading(false);
    }
  };

  return (
    <Container className="my-5" style={{maxWidth: '1200px'}}>
      <div className="mb-5">
        <h1 className="mb-2 fw-bold" style={{color: '#2c2c2c', fontSize: '2.5rem', letterSpacing: '-0.5px'}}>
          {esCompraDirecta ? 'Compra Rápida' : 'Finalizar Compra'}
        </h1>
        <p className="text-muted" style={{fontSize: '1rem'}}>
          Completa tus datos para procesar el pedido
        </p>
      </div>

      {msg.text && (
        <Alert
          variant={msg.type}
          className="mb-4 border-0 shadow-sm"
          style={{borderRadius: '12px'}}
        >
          {msg.text}
        </Alert>
      )}

      {tienePreparaciones && (
        <Alert
          variant="warning"
          className="d-flex align-items-center mb-4 border-0 shadow-sm"
          style={{borderRadius: '12px', backgroundColor: '#fff3cd'}}
        >
          <FaInfoCircle className="me-3" size={20}/>
          <span>Este pedido incluye preparaciones y solo está disponible para retiro en tienda.</span>
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="mb-4 border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div
                  className="d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}
                >
                  1
                </div>
                <h4 className="mb-0 fw-bold" style={{color: '#2c2c2c', fontSize: '1.3rem'}}>
                  Método de Entrega
                </h4>
              </div>

              <Row className="g-3">
                <Col xs={6}>
                  <div
                    onClick={() => !tienePreparaciones && setTipoEntrega('delivery')}
                    style={{
                      border: tipoEntrega === 'delivery' ? '2px solid #2c2c2c' : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: tienePreparaciones ? 'not-allowed' : 'pointer',
                      backgroundColor: tipoEntrega === 'delivery' ? '#f8f9fa' : 'white',
                      opacity: tienePreparaciones ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <FaTruck size={32} className="mb-2" style={{color: tipoEntrega === 'delivery' ? '#2c2c2c' : '#999'}} />
                    <div className="fw-bold" style={{color: '#2c2c2c', fontSize: '1rem'}}>Envío a Domicilio</div>
                    <small className="text-muted">$5.000</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div
                    onClick={() => setTipoEntrega('retiro')}
                    style={{
                      border: tipoEntrega === 'retiro' ? '2px solid #2c2c2c' : '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      backgroundColor: tipoEntrega === 'retiro' ? '#f8f9fa' : 'white',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <FaStore size={32} className="mb-2" style={{color: tipoEntrega === 'retiro' ? '#2c2c2c' : '#999'}} />
                    <div className="fw-bold" style={{color: '#2c2c2c', fontSize: '1rem'}}>Retiro en Tienda</div>
                    <small className="text-muted">Gratis</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4 border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div
                  className="d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}
                >
                  2
                </div>
                <h4 className="mb-0 fw-bold" style={{color: '#2c2c2c', fontSize: '1.3rem'}}>
                  Datos de Contacto
                </h4>
              </div>

              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="fw-semibold small text-muted">Email</Form.Label>
                    <Form.Control
                      placeholder="correo@ejemplo.com"
                      name="email"
                      value={datosEnvio.email}
                      onChange={handleInputChange}
                      style={{
                        borderRadius: '8px',
                        border: '1.5px solid #e0e0e0',
                        padding: '12px'
                      }}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold small text-muted">RUT</Form.Label>
                    <Form.Control
                      placeholder="12345678-9"
                      name="rut"
                      value={datosEnvio.rut}
                      onChange={handleRutChange}
                      style={{
                        borderRadius: '8px',
                        border: '1.5px solid #e0e0e0',
                        padding: '12px'
                      }}
                    />
                  </Col>
                </Row>

                <div className="mt-3">
                  <Form.Label className="fw-semibold small text-muted">Teléfono</Form.Label>
                  <div className="input-group">
                    <span
                      className="input-group-text"
                      style={{
                        borderRadius: '8px 0 0 8px',
                        border: '1.5px solid #e0e0e0',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      +56 9
                    </span>
                    <Form.Control
                      placeholder="12345678"
                      value={telefonoInput}
                      onChange={handleTelefonoChange}
                      style={{
                        borderRadius: '0 8px 8px 0',
                        border: '1.5px solid #e0e0e0',
                        borderLeft: 'none',
                        padding: '12px'
                      }}
                    />
                  </div>
                </div>

                {tipoEntrega === 'delivery' && (
                  <>
                    <Row className="g-3 mt-3">
                      <Col md={6}>
                        <Form.Label className="fw-semibold small text-muted">Región</Form.Label>
                        <Form.Select
                          name="region"
                          value={datosEnvio.region}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: '8px',
                            border: '1.5px solid #e0e0e0',
                            padding: '12px'
                          }}
                        >
                          <option value="">Selecciona una región...</option>
                          {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="fw-semibold small text-muted">Ciudad</Form.Label>
                        <Form.Control
                          placeholder="Ej: Valdivia"
                          name="ciudad"
                          value={datosEnvio.ciudad}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: '8px',
                            border: '1.5px solid #e0e0e0',
                            padding: '12px'
                          }}
                        />
                      </Col>
                    </Row>
                    <div className="mt-3">
                      <Form.Label className="fw-semibold small text-muted">Dirección</Form.Label>
                      <Form.Control
                        placeholder="Calle, número, depto/casa"
                        name="direccion"
                        value={datosEnvio.direccion}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: '8px',
                          border: '1.5px solid #e0e0e0',
                          padding: '12px'
                        }}
                      />
                    </div>
                  </>
                )}
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm" style={{borderRadius: '16px', overflow: 'hidden'}}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div
                  className="d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                  }}
                >
                  3
                </div>
                <h4 className="mb-0 fw-bold" style={{color: '#2c2c2c', fontSize: '1.3rem'}}>
                  Método de Pago
                </h4>
              </div>

              <div
                className="p-4 rounded text-center"
                style={{
                  border: '2px solid #009ee3',
                  borderRadius: '12px',
                  backgroundColor: '#f0f9ff'
                }}
              >
                <FaCreditCard size={48} className="mb-3" style={{ color: '#009ee3' }} />
                <h5 className="fw-bold mb-2" style={{ color: '#009ee3' }}>Mercado Pago</h5>
                <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>
                  Débito, Crédito, Webpay y más opciones
                </p>
              </div>

              <Alert
                variant="info"
                className="mt-3 border-0"
                style={{
                  backgroundColor: '#e7f3ff',
                  borderRadius: '12px',
                  color: '#0066cc'
                }}
              >
                <div className="d-flex align-items-start">
                  <FaInfoCircle className="me-2 mt-1" size={16}/>
                  <small>
                    Serás redirigido a la plataforma segura de <strong>Mercado Pago</strong>.
                    Podrás pagar con Webpay, CuentaRUT o Tarjetas. Tu pedido se aprobará automáticamente.
                  </small>
                </div>
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <div className="sticky-top" style={{ top: '100px' }}>
            <Card className="border-0 shadow-lg" style={{borderRadius: '16px', overflow: 'hidden'}}>
              <Card.Body className="p-4">
                <h4 className="mb-4 fw-bold" style={{color: '#2c2c2c', fontSize: '1.5rem'}}>
                  Resumen del Pedido
                </h4>

                <div className="mb-4">
                  {itemsAProcesar.map((item, idx) => (
                    <div
                      key={idx}
                      className="d-flex justify-content-between align-items-start mb-3 pb-3"
                      style={{
                        borderBottom: idx < itemsAProcesar.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{color: '#2c2c2c', fontSize: '0.95rem'}}>
                          {item.producto?.nombre}
                        </div>
                        <small className="text-muted">
                          {item.formato?.nombre} × {item.cantidad}
                        </small>
                        {erroresStock[`${item.id_producto}-${item.id_formato}`] && (
                          <div className="text-danger small fw-bold mt-1">
                            {erroresStock[`${item.id_producto}-${item.id_formato}`]}
                          </div>
                        )}
                      </div>
                      <div className="fw-semibold" style={{color: '#2c2c2c'}}>
                        ${((item.formato?.precio||0)*item.cantidad).toLocaleString('es-CL')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{color: '#666'}}>Subtotal</span>
                    <span className="fw-semibold" style={{color: '#2c2c2c'}}>
                      ${totalProductos.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{color: '#666'}}>Envío</span>
                    <span className="fw-semibold" style={{color: costoEnvio === 0 ? '#4CAF50' : '#2c2c2c'}}>
                      {costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toLocaleString('es-CL')}`}
                    </span>
                  </div>
                </div>

                <div
                  className="d-flex justify-content-between align-items-center py-3 mb-4"
                  style={{borderTop: '2px solid #f0f0f0', borderBottom: '2px solid #f0f0f0'}}
                >
                  <span className="fw-bold text-uppercase" style={{color: '#2c2c2c', fontSize: '1.1rem', letterSpacing: '1px'}}>
                    Total
                  </span>
                  <span className="fw-bold" style={{color: '#2c2c2c', fontSize: '2rem'}}>
                    ${totalFinal.toLocaleString('es-CL')}
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-100 border-0 fw-bold py-3 mb-3"
                  onClick={procesarCompra}
                  disabled={loading}
                  style={{
                    backgroundColor: '#009ee3',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    letterSpacing: '0.5px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? (
                    <Spinner size="sm" animation="border"/>
                  ) : (
                    <>
                      <FaCreditCard className="me-2" />
                      Pagar con Mercado Pago
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center text-muted small">
                    <FaLock className="me-2" size={12} />
                    <span style={{fontSize: '0.85rem'}}>Pago 100% seguro y encriptado</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Checkout;