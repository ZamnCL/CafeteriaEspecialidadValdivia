import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/cliente';
import { useNavigate, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { FaTruck, FaStore, FaInfoCircle, FaTrash, FaExclamationTriangle, FaCreditCard, FaExchangeAlt, FaCheckCircle } from 'react-icons/fa';

// ... (Mantenemos constantes y funciones auxiliares igual) ...
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
    
    // ... (Lógica de correo igual que antes) ...
    // Para simplificar el código aquí, asumo que mantienes esta función igual
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
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-coffee-title">{esCompraDirecta ? 'Compra Rápida' : 'Finalizar Compra'}</h2>
      {msg.text && <Alert variant={msg.type} className="shadow-sm">{msg.text}</Alert>}
      
      {tienePreparaciones && (
        <Alert variant="warning" className="d-flex align-items-center mb-4"><FaInfoCircle className="me-3"/>Solo retiro en tienda.</Alert>
      )}

      <Row>
        <Col md={7}>
          {/* 1. ENTREGA */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">1. Método de Entrega</Card.Header>
            <Card.Body>
              <div className="d-flex gap-3">
                <Button 
                  onClick={() => !tienePreparaciones && setTipoEntrega('delivery')} 
                  className="flex-grow-1 py-3"
                  disabled={tienePreparaciones} 
                  variant={tipoEntrega === 'delivery' ? 'dark' : 'outline-secondary'}
                >
                  <FaTruck className="me-2"/> Envío
                </Button>
                <Button 
                  onClick={() => setTipoEntrega('retiro')} 
                  className="flex-grow-1 py-3"
                  variant={tipoEntrega === 'retiro' ? 'dark' : 'outline-secondary'}
                >
                  <FaStore className="me-2"/> Retiro
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* 2. CONTACTO */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">2. Datos de Contacto</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}><Form.Control placeholder="Email" name="email" value={datosEnvio.email} onChange={handleInputChange} className="mb-3" /></Col>
                  <Col md={6}><Form.Control placeholder="RUT" name="rut" value={datosEnvio.rut} onChange={handleRutChange} className="mb-3" /></Col>
                </Row>
                <div className="input-group mb-3">
                    <span className="input-group-text">+56 9</span>
                    <Form.Control placeholder="Teléfono" value={telefonoInput} onChange={handleTelefonoChange} />
                </div>
                {tipoEntrega === 'delivery' && (
                  <>
                    <Row>
                      <Col md={6}>
                          <Form.Select name="region" value={datosEnvio.region} onChange={handleInputChange} className="mb-3">
                            <option value="">Región...</option>
                            {REGIONES_CHILE.map(r => <option key={r} value={r}>{r}</option>)}
                          </Form.Select>
                      </Col>
                      <Col md={6}><Form.Control placeholder="Ciudad" name="ciudad" onChange={handleInputChange} className="mb-3" /></Col>
                    </Row>
                    <Form.Control placeholder="Dirección y número" name="direccion" onChange={handleInputChange} className="mb-3" />
                  </>
                )}
              </Form>
            </Card.Body>
          </Card>
          
          {/* 3. PAGO */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-warning text-dark fw-bold">3. Método de Pago</Card.Header>
            <Card.Body>
                <div
                    className="p-4 border-2 border-primary rounded text-center bg-blue-light shadow-sm"
                    style={{ borderColor: '#009ee3' }}
                >
                    <FaCreditCard size={40} className="mb-3" style={{ color: '#009ee3' }} />
                    <h5 className="fw-bold mb-2" style={{ color: '#009ee3' }}>Pago con Mercado Pago</h5>
                    <p className="text-muted mb-0">Débito, Crédito, Webpay y más</p>
                </div>

                <Alert variant="info" className="mt-3 border-0 bg-info-subtle text-info-emphasis">
                    <FaInfoCircle className="me-2"/>
                    Serás redirigido a la plataforma segura de <strong>Mercado Pago</strong>.
                    Podrás pagar con Webpay, CuentaRUT o Tarjetas. Tu pedido se aprobará automáticamente.
                </Alert>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          {/* RESUMEN (Igual que antes) */}
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-dark text-white fw-bold">Resumen</Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {itemsAProcesar.map((item, idx) => (
                    <ListGroup.Item key={idx} className="px-0 py-2">
                        <div className="d-flex justify-content-between">
                            <small>{item.producto?.nombre} x {item.cantidad}</small>
                            <small>${((item.formato?.precio||0)*item.cantidad).toLocaleString('es-CL')}</small>
                        </div>
                        {erroresStock[`${item.id_producto}-${item.id_formato}`] && <div className="text-danger small fw-bold">{erroresStock[`${item.id_producto}-${item.id_formato}`]}</div>}
                    </ListGroup.Item>
                ))}
              </ListGroup>
              <div className="d-flex justify-content-between fw-bold fs-5 text-coffee">
                <span>Total:</span><span>${totalFinal.toLocaleString('es-CL')}</span>
              </div>
              <Button 
                variant={metodoPago === 'webpay' ? "primary" : "success"} 
                size="lg" 
                className="w-100 mt-3 border-0 fw-bold" 
                onClick={procesarCompra} 
                disabled={loading}
                style={{ backgroundColor: metodoPago === 'webpay' ? '#009ee3' : '#28a745' }}
              >
                {loading ? <Spinner size="sm"/> : (metodoPago === 'webpay' ? 'Pagar con Mercado Pago' : 'Finalizar Pedido')}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Checkout;