import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Nav, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import ProductCard from '../components/ProductCard';
import { FaSearch } from 'react-icons/fa';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Productos
      const { data: prodData } = await supabase
        .from('productos')
        .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
        .eq('estado', 'Publicado')
        .order('id_producto', { ascending: false });

      // 2. Categorías
      const { data: catData } = await supabase.from('categoria').select('*');

      setProductos(prodData || []);
      setCategorias(catData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTRADO ---
  const productosFiltrados = productos.filter(p => {
    const cumpleCategoria = filtroCategoria === 'todos' || p.id_categoria == filtroCategoria;
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleCategoria && cumpleBusqueda;
  });

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-5">
      {/* HEADER */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-coffee mb-3">Tienda & Catálogo</h1>
        <p className="lead text-muted">Explora nuestra selección completa de productos.</p>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="mb-5">
        {/* Buscador */}
        <Row className="justify-content-center mb-4">
          <Col md={6}>
            <InputGroup className="shadow-sm rounded-pill overflow-hidden">
              <InputGroup.Text className="bg-white border-0 ps-3"><FaSearch className="text-muted"/></InputGroup.Text>
              <Form.Control 
                placeholder="Buscar producto..." 
                className="border-0 shadow-none" 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>

        {/* Filtros Pills (Estilo Global) */}
        <Nav variant="pills" className="nav-pills-coffee justify-content-center">
          <Nav.Item>
            <Nav.Link active={filtroCategoria === 'todos'} onClick={() => setFiltroCategoria('todos')}>
              Todos
            </Nav.Link>
          </Nav.Item>
          {categorias.map(cat => (
            <Nav.Item key={cat.id_categoria}>
              <Nav.Link active={filtroCategoria == cat.id_categoria} onClick={() => setFiltroCategoria(cat.id_categoria)}>
                {cat.nombre}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {/* GRID DE PRODUCTOS */}
      <Row className="g-4">
        {productosFiltrados.map(prod => (
          <Col key={prod.id_producto} sm={6} md={4} lg={3}>
            <ProductCard producto={prod} />
          </Col>
        ))}
        {productosFiltrados.length === 0 && (
          <div className="text-center py-5 text-muted">
            <h4>No encontramos productos con esos filtros.</h4>
          </div>
        )}
      </Row>
    </Container>
  );
}

export default Catalogo;