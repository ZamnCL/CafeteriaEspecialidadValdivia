import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Image, Form, Button, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useCart } from '../context/CartContext';
import { FaCheckCircle, FaShoppingCart, FaCreditCard, FaArrowLeft, FaClock, FaInfoCircle } from 'react-icons/fa';
import './ProductoDetalle.css';

import ResenasProducto from '../components/ResenasProducto';

function ProductoDetalle() {
  const { id } = useParams();
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormatoId, setSelectedFormatoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [showToast, setShowToast] = useState(false);
  
  const [procesandoCompra, setProcesandoCompra] = useState(false);

  const [fechaRetiro, setFechaRetiro] = useState('');
  const [horaRetiro, setHoraRetiro] = useState('');
  const [errorReserva, setErrorReserva] = useState('');

  const generarHorarios = () => {
    const horarios = [];
    let hora = 9;
    let minutos = 15;
    while (hora < 18 || (hora === 18 && minutos <= 45)) {
      const hStr = hora.toString().padStart(2, '0');
      const mStr = minutos.toString().padStart(2, '0');
      horarios.push(`${hStr}:${mStr}`);
      minutos += 15;
      if (minutos === 60) { minutos = 0; hora++; }
    }
    return horarios;
  };
  const listaHorarios = generarHorarios();

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
          .eq('id_producto', id)
          .single();

        if (error) throw error;
        setProducto(data);

        if (data.formatos?.length > 0) {
          const ordenados = data.formatos.sort((a, b) => a.precio - b.precio);
          setSelectedFormatoId(ordenados[0].id_formato);
        }
        setFechaRetiro(new Date().toISOString().split('T')[0]);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProducto();
  }, [id]);

  const getFormatoActual = () => producto?.formatos?.find(f => f.id_formato === parseInt(selectedFormatoId));
  const formatoActual = getFormatoActual();
  const stockActual = formatoActual?.stock || 0;
  const descripcionMostrar = formatoActual?.descripcion || producto?.descripcion;

  const handleCantidadChange = (e) => {
    let valor = parseInt(e.target.value);
    if (isNaN(valor) || valor < 1) valor = 1;
    if (!esPreparacion() && valor > stockActual) valor = stockActual;
    setCantidad(valor);
  };

  const handleIncrementar = () => { if (esPreparacion() || cantidad < stockActual) setCantidad(c => c + 1); };
  const handleDecrementar = () => { setCantidad(c => Math.max(1, c - 1)); };

  const esPreparacion = () => {
    const cat = producto?.categoria?.nombre?.toLowerCase() || '';
    // CORRECCIÓN: Se eliminó 'cafeteras' de la lista para que no pida hora
    return cat.includes('preparación') || cat.includes('bebida') || cat.includes('barra') || 
           cat.includes('pastelería') || cat.includes('sandwich') || cat.includes('métodos') || 
           cat.includes('servicio') || cat.includes('filtrado');
  };

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    if (!nuevaFecha) { setFechaRetiro(''); return; }
    const diaSemana = new Date(`${nuevaFecha}T12:00:00`).getDay(); 
    if (diaSemana === 0) { 
      setErrorReserva("Los domingos estamos cerrados. Por favor elige otro día.");
      setFechaRetiro('');
    } else {
      setErrorReserva('');
      setFechaRetiro(nuevaFecha);
    }
  };

  const validarReserva = () => {
    if (!esPreparacion()) return true; 
    if (!fechaRetiro || !horaRetiro) { setErrorReserva('Selecciona fecha y hora de retiro.'); return false; }
    const fechaHoraUser = new Date(`${fechaRetiro}T${horaRetiro}`);
    const ahora = new Date();
    if (fechaHoraUser < ahora) { setErrorReserva('La hora seleccionada ya pasó.'); return false; }
    const [h, m] = horaRetiro.split(':').map(Number);
    const minutosTotales = h * 60 + m;
    if (minutosTotales < 540 || minutosTotales > 1140) { 
        setErrorReserva('El horario de retiro es de 09:00 a 19:00 hrs.');
        return false;
    }
    setErrorReserva('');
    return true;
  };

  const handleAgregar = () => {
    if (!formatoActual) return;
    if (!esPreparacion() && (cantidad > stockActual || stockActual === 0)) return;
    if (!validarReserva()) return;
    const reservaData = esPreparacion() ? { date: fechaRetiro, time: horaRetiro } : null;
    addToCart(producto, formatoActual.id_formato, formatoActual.nombre, formatoActual.precio, cantidad, reservaData);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleComprarAhora = async () => {
    if (!formatoActual) return;
    if (!esPreparacion() && (cantidad > stockActual || stockActual === 0)) return;
    if (!validarReserva()) return;
    
    setProcesandoCompra(true);

    try {
      // NO borramos el carrito, enviamos el producto directo al checkout
      // (Esto asume que tu Checkout.jsx soporta location.state como configuramos antes)
      const itemDirecto = {
        id_producto: producto.id_producto,
        id_formato: formatoActual.id_formato,
        cantidad: cantidad,
        producto: producto,
        formato: formatoActual,
        reserva: esPreparacion() ? { date: fechaRetiro, time: horaRetiro } : null
      };

      navigate('/checkout', { state: { compraDirecta: [itemDirecto] } });
    } catch (error) {
      console.error("Error en comprar ahora:", error);
      setProcesandoCompra(false);
    }
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  if (!producto) return <Container className="mt-5 text-center"><h3>Producto no encontrado</h3></Container>;

  return (
    <Container className="my-5">
      <Link to="/catalogo" className="text-decoration-none text-muted mb-4 d-inline-block fw-bold"><FaArrowLeft className="me-2"/> Volver a la Tienda</Link>

      <Row className="g-5">
        <Col lg={6}>
          <div className="product-detail-img-container animate-fade-in">
            {producto.imagen ? <Image src={producto.imagen} alt={producto.nombre} fluid className="w-100 rounded-3" style={{ objectFit: 'cover', aspectRatio: '1/1' }}/> : <div className="bg-light d-flex align-items-center justify-content-center text-muted rounded-3" style={{ aspectRatio: '1/1' }}>SIN IMAGEN</div>}
          </div>
        </Col>

        <Col lg={6}>
          <div className="ps-lg-4">
            <Badge bg="dark" text="white" className="mb-3 px-3 py-2 rounded-pill text-uppercase tracking-wider">{producto.categoria?.nombre}</Badge>
            <h1 className="display-5 detail-title mb-2">{producto.nombre}</h1>
            <div className="detail-price mb-4">${formatoActual?.precio?.toLocaleString() || '---'}</div>

            {producto.formatos?.length > 0 && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-uppercase text-muted">Selecciona Opción:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {producto.formatos.sort((a, b) => a.precio - b.precio).map(f => (
                    <Button key={f.id_formato} variant={parseInt(selectedFormatoId) === f.id_formato ? "dark" : "outline-secondary"} className="rounded-pill px-4" onClick={() => { setSelectedFormatoId(f.id_formato); setCantidad(1); }}>{f.nombre}</Button>
                  ))}
                </div>
              </Form.Group>
            )}

            {esPreparacion() && (
              <div className="p-3 mb-4 rounded border border-warning bg-light animate-fade-in">
                <h6 className="fw-bold text-coffee mb-3 d-flex align-items-center"><FaClock className="me-2"/> Programa tu retiro</h6>
                <Row className="g-2">
                  <Col xs={6}><Form.Control type="date" value={fechaRetiro} onChange={handleFechaChange} min={new Date().toISOString().split('T')[0]} /></Col>
                  <Col xs={6}><Form.Control type="time" list="horarios-sugeridos" value={horaRetiro} onChange={(e) => setHoraRetiro(e.target.value)} /><datalist id="horarios-sugeridos">{listaHorarios.map(h => (<option key={h} value={h} />))}</datalist></Col>
                </Row>
                {errorReserva && <Alert variant="danger" className="mt-2 py-2 small mb-0">{errorReserva}</Alert>}
                <div className="small text-muted mt-2 fst-italic">* Horario Lun-Vie de 09:00 a 19:00 hrs.</div>
              </div>
            )}

            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="quantity-selector">
                <button className="btn-quantity" onClick={handleDecrementar}>-</button>
                <input type="number" className="quantity-input" value={cantidad} onChange={handleCantidadChange} min="1" max={!esPreparacion() ? stockActual : 99} disabled={!esPreparacion() && stockActual === 0} />
                <button className="btn-quantity" onClick={handleIncrementar}>+</button>
              </div>
              {!esPreparacion() && (<span className={`small fw-bold ${stockActual > 0 ? 'text-success' : 'text-danger'}`}>{stockActual > 0 ? `${stockActual} disponibles` : 'Agotado'}</span>)}
            </div>

            <div className="d-grid gap-3 d-md-flex mb-5">
              <Button 
                className="btn-add-cart rounded-pill px-4 py-3 flex-grow-1 fw-bold" 
                onClick={handleAgregar} 
                disabled={!formatoActual || (!esPreparacion() && stockActual < 1) || procesandoCompra}
              >
                <FaShoppingCart className="me-2"/> Añadir al Carro
              </Button>
              
              <Button 
                className="btn-buy-now rounded-pill px-4 py-3 flex-grow-1 fw-bold" 
                onClick={handleComprarAhora} 
                disabled={!formatoActual || (!esPreparacion() && stockActual < 1) || procesandoCompra}
              >
                {procesandoCompra ? <Spinner as="span" animation="border" size="sm" /> : <><FaCreditCard className="me-2"/> Comprar Ahora</>}
              </Button>
            </div>

            <div className="bg-light p-4 rounded-4 border">
                <h5 className="fw-bold mb-3 text-coffee-dark"><FaInfoCircle className="me-2"/> Información del Producto</h5>
                <p className="text-muted" style={{lineHeight: '1.7'}}>{descripcionMostrar || 'Sin descripción disponible.'}</p>
                
                {(producto.pais || producto.variedad || producto.altura || producto.proceso || producto.notas) && (
                    <div className="mt-4 pt-3 border-top">
                        <h6 className="fw-bold text-coffee-accent mb-3 text-uppercase small" style={{letterSpacing: '1px'}}>Ficha Técnica</h6>
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-2 text-muted small">
                            {producto.pais && <li><strong>Origen:</strong> {producto.pais}</li>}
                            {producto.variedad && <li><strong>Variedad:</strong> {producto.variedad}</li>}
                            {producto.altura && <li><strong>Altura:</strong> {producto.altura}</li>}
                            {producto.proceso && <li><strong>Proceso:</strong> {producto.proceso}</li>}
                            {producto.notas && <li className="text-dark bg-white p-2 rounded border border-warning mt-1"><strong>Notas de Cata:</strong> {producto.notas}</li>}
                        </ul>
                    </div>
                )}
            </div>

          </div>
        </Col>
      </Row>

      <Row><Col lg={12}><ResenasProducto idProducto={producto.id_producto} /></Col></Row>

      <div className={`aesthetic-toast ${showToast ? 'show' : ''}`}><FaCheckCircle className="text-success fs-4" /><div><div className="fw-bold">¡Añadido al carro!</div><small className="text-white-50">{producto.nombre} {horaRetiro ? `(Retiro: ${horaRetiro})` : ''} x{cantidad}</small></div></div>
    </Container>
  );
}

export default ProductoDetalle;