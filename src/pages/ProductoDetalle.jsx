import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Image, Form, Button, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useCart } from '../context/CartContext';

function ProductoDetalle() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFormatoId, setSelectedFormatoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`
            *,
            categoria:categoria!productos_id_categoria_fkey (nombre),
            formatos:formatos!formatos_id_producto_fkey (*)
          `)
          .eq('id_producto', id)
          .single();

        if (error) throw error;
        setProducto(data);

        if (data.formatos?.length > 0) {
          const ordenados = data.formatos.sort((a, b) => a.id_formato - b.id_formato);
          setSelectedFormatoId(ordenados[0].id_formato);
        }
      } catch (err) {
        setError('Error cargando producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [id]);

  const getFormatoActual = () => producto?.formatos?.find(f => f.id_formato === parseInt(selectedFormatoId));
  const formatoActual = getFormatoActual();
  const descripcionMostrar = formatoActual?.descripcion || producto?.descripcion;

  const handleAgregar = () => {
    if (!formatoActual) return;
    addToCart(producto, formatoActual, cantidad);
    alert(`Agregado: ${producto.nombre}`);
  };

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  if (!producto) return <Container className="mt-5"><Alert variant="danger">No encontrado</Alert></Container>;

  const esBarraFiltrados = producto.nombre.includes("Filtrado");

  return (
    <Container className="my-5">
      <Link to="/catalogo" className="btn btn-outline-dark mb-4 rounded-pill px-4">← Volver al Catálogo</Link>
      
      <Row className="g-5 align-items-center">
        <Col md={6}>
          <div className="text-center p-4 rounded-4 shadow-sm" style={{backgroundColor: '#f8f9fa', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {producto.imagen ? (
              <Image 
                src={producto.imagen} 
                alt={producto.nombre} 
                fluid 
                className="rounded-3"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            ) : (
              <div className="text-muted fw-bold fs-4">SIN IMAGEN DISPONIBLE</div>
            )}
          </div>
        </Col>

        <Col md={6}>
          <Badge bg="warning" text="dark" className="mb-2 px-3 py-2 rounded-pill text-uppercase">
            {producto.categoria?.nombre}
          </Badge>
          <h1 className="fw-bold display-5 mb-2">{producto.nombre}</h1>
          <h2 className="text-success fw-bold mb-4">${formatoActual?.precio?.toLocaleString() || '---'}</h2>

          <div className="p-4 bg-light rounded-3 border mb-4">
            <h5 className="fw-bold text-coffee-dark">
              {esBarraFiltrados ? `Sobre el método: ${formatoActual?.nombre}` : 'Descripción'}
            </h5>
            <p className="mb-0 text-muted" style={{fontSize: '1.05rem', lineHeight: '1.6'}}>
              {descripcionMostrar || 'Sin descripción detallada.'}
            </p>
          </div>

          {producto.formatos?.length > 1 && (
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">
                {esBarraFiltrados ? 'Elige tu Método de Extracción:' : 'Selecciona Formato:'}
              </Form.Label>
              <Form.Select 
                size="lg" 
                value={selectedFormatoId} 
                onChange={(e) => setSelectedFormatoId(e.target.value)}
                style={{border: '2px solid var(--coffee-accent)'}}
              >
                {producto.formatos.map(f => (
                  <option key={f.id_formato} value={f.id_formato}>
                    {f.nombre} — ${f.precio.toLocaleString()}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <div className="d-flex gap-3">
            <InputGroup style={{width: '140px'}}>
              <Button variant="outline-dark" onClick={() => setCantidad(c => Math.max(1, c - 1))}>-</Button>
              <Form.Control className="text-center fw-bold" value={cantidad} readOnly />
              <Button variant="outline-dark" onClick={() => setCantidad(c => c + 1)}>+</Button>
            </InputGroup>
            
            <Button 
              variant="dark" 
              size="lg" 
              className="w-100 rounded-pill" 
              onClick={handleAgregar}
              style={{backgroundColor: 'var(--coffee-dark)', borderColor: 'var(--coffee-dark)'}}
            >
              Agregar al Pedido
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductoDetalle;