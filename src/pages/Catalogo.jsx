import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Nav, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import ProductCard from '../components/ProductCard';
import { FaSearch, FaCheckCircle } from 'react-icons/fa'; // Importamos icono para el toast
import './Catalogo.css';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Estado para la notificación
  const [showToast, setShowToast] = useState(false);
  const [toastProduct, setToastProduct] = useState('');

  // Helper para identificar preparaciones
  const esPreparacion = (nombreCat) => {
    const n = nombreCat.toLowerCase();
    return n.includes('preparación') || n.includes('filtrado') || n.includes('bebida') || n.includes('barra');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from('categoria').select('*');
      const categoriasTienda = (catData || []).filter(c => !esPreparacion(c.nombre));
      setCategorias(categoriasTienda);

      const { data: prodData } = await supabase
        .from('productos')
        .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
        .eq('estado', 'Publicado')
        .order('id_producto', { ascending: false });

      const idsCategoriasTienda = categoriasTienda.map(c => c.id_categoria);
      const productosTienda = (prodData || []).filter(p => idsCategoriasTienda.includes(p.id_categoria));

      setProductos(productosTienda);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowToast = (nombreProducto) => {
    setToastProduct(nombreProducto);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const productosFiltrados = productos.filter(p => {
    const cumpleCategoria = filtroCategoria === 'todos' || p.id_categoria == filtroCategoria;
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleCategoria && cumpleBusqueda;
  });

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-coffee mb-3">Tienda & Catálogo</h1>
        <p className="lead text-muted">Explora nuestra selección completa de productos.</p>
      </div>

      <div className="mb-5">
        <Row className="justify-content-center mb-4">
          <Col md={6}>
            <InputGroup className="shadow-sm rounded-pill overflow-hidden">
              <InputGroup.Text className="bg-white border-0 ps-3"><FaSearch className="text-muted"/></InputGroup.Text>
              <Form.Control placeholder="Buscar producto..." className="border-0 shadow-none" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </InputGroup>
          </Col>
        </Row>

        <div className="category-scroll-container mb-5 justify-content-center">
          <button className={`category-pill ${filtroCategoria === 'todos' ? 'active' : ''}`} onClick={() => setFiltroCategoria('todos')}>Todos</button>
          {categorias.map(cat => (
            <button key={cat.id_categoria} className={`category-pill ${filtroCategoria == cat.id_categoria ? 'active' : ''}`} onClick={() => setFiltroCategoria(cat.id_categoria)}>{cat.nombre}</button>
          ))}
        </div>
      </div>

      <Row className="g-4">
        {productosFiltrados.map(prod => (
          <Col key={prod.id_producto} sm={6} md={4} lg={3}>
            <ProductCard 
              producto={prod} 
              isReserva={false} 
              onShowToast={handleShowToast} // Pasamos la función
            />
          </Col>
        ))}
        {productosFiltrados.length === 0 && <div className="text-center py-5 text-muted"><h4>No encontramos productos.</h4></div>}
      </Row>

      {/* NOTIFICACIÓN FLOTANTE */}
      <div className={`aesthetic-toast ${showToast ? 'show' : ''}`}>
        <FaCheckCircle className="text-success fs-4" />
        <div>
          <div className="fw-bold">¡Añadido al carro!</div>
          <small className="text-white-50">{toastProduct}</small>
        </div>
      </div>
    </Container>
  );
}

export default Catalogo;