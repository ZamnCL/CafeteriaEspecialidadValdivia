import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Image, Form, Button, Badge, Spinner, Accordion } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useCart } from '../context/CartContext';
import { FaCheckCircle, FaShoppingCart, FaCreditCard, FaArrowLeft } from 'react-icons/fa';
import './ProductoDetalle.css';

function ProductoDetalle() {
  const { id } = useParams();
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormatoId, setSelectedFormatoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [showToast, setShowToast] = useState(false);

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
    if (valor > stockActual) valor = stockActual;
    setCantidad(valor);
  };

  const handleIncrementar = () => { if (cantidad < stockActual) setCantidad(c => c + 1); };
  const handleDecrementar = () => { setCantidad(c => Math.max(1, c - 1)); };

  const handleAgregar = () => {
    if (!formatoActual || cantidad > stockActual || stockActual === 0) return;
    addToCart(producto, formatoActual, cantidad);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleComprarAhora = () => {
    if (!formatoActual || cantidad > stockActual || stockActual === 0) return;
    clearCart(); 
    addToCart(producto, formatoActual, cantidad);
    navigate('/checkout');
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

            {/* SELECTOR DE CANTIDAD CUADRADO */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="quantity-selector">
                <button className="btn-quantity" onClick={handleDecrementar} disabled={stockActual === 0}>-</button>
                <input type="number" className="quantity-input" value={cantidad} onChange={handleCantidadChange} min="1" max={stockActual} disabled={stockActual === 0} />
                <button className="btn-quantity" onClick={handleIncrementar} disabled={stockActual === 0 || cantidad >= stockActual}>+</button>
              </div>
              <span className={`small fw-bold ${stockActual > 0 ? 'text-success' : 'text-danger'}`}>
                {stockActual > 0 ? `${stockActual} disponibles` : 'Agotado'}
              </span>
            </div>

            <div className="d-grid gap-3 d-md-flex mb-5">
              <Button className="btn-add-cart rounded-pill px-4 py-3 flex-grow-1 fw-bold" onClick={handleAgregar} disabled={!formatoActual || stockActual < 1}>
                <FaShoppingCart className="me-2"/> Añadir al Carro
              </Button>
              <Button className="btn-buy-now rounded-pill px-4 py-3 flex-grow-1 fw-bold" onClick={handleComprarAhora} disabled={!formatoActual || stockActual < 1}>
                <FaCreditCard className="me-2"/> Comprar Ahora
              </Button>
            </div>

            <Accordion defaultActiveKey="0" className="custom-accordion">
              <Accordion.Item eventKey="0"><Accordion.Header>Descripción</Accordion.Header><Accordion.Body>{descripcionMostrar || 'Sin descripción.'}{producto.notas && <div className="mt-3 p-3 bg-light rounded border-start border-4 border-warning"><strong>Notas de Cata:</strong> {producto.notas}</div>}</Accordion.Body></Accordion.Item>
              {(producto.pais || producto.proceso) && (<Accordion.Item eventKey="1"><Accordion.Header>Ficha Técnica</Accordion.Header><Accordion.Body><ul className="list-unstyled mb-0">{producto.pais && <li><strong>Origen:</strong> {producto.pais}</li>}{producto.variedad && <li><strong>Variedad:</strong> {producto.variedad}</li>}{producto.altura && <li><strong>Altura:</strong> {producto.altura}</li>}{producto.proceso && <li><strong>Proceso:</strong> {producto.proceso}</li>}</ul></Accordion.Body></Accordion.Item>)}
            </Accordion>
          </div>
        </Col>
      </Row>

      <div className={`aesthetic-toast ${showToast ? 'show' : ''}`}>
        <FaCheckCircle className="text-success fs-4" />
        <div>
          <div className="fw-bold">¡Añadido al carro!</div>
          <small className="text-white-50">{producto.nombre} x{cantidad}</small>
        </div>
      </div>
    </Container>
  );
}

export default ProductoDetalle;