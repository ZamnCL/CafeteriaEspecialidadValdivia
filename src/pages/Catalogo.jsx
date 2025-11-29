import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import ProductCard from '../components/ProductCard';
import { FaSearch } from 'react-icons/fa';
import './Catalogo.css'; // Asegúrate de crear este archivo o agregar el CSS al final

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Helper para identificar preparaciones (igual que en admin)
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
      // 1. Categorías (Traemos todas)
      const { data: catData } = await supabase.from('categoria').select('*');
      
      // Filtramos SOLO las que son productos físicos (NO preparaciones)
      const categoriasTienda = (catData || []).filter(c => !esPreparacion(c.nombre));
      setCategorias(categoriasTienda);

      // 2. Productos
      const { data: prodData } = await supabase
        .from('productos')
        .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
        .eq('estado', 'Publicado')
        .order('id_producto', { ascending: false });

      // Filtramos productos que pertenezcan a las categorías de tienda
      const idsCategoriasTienda = categoriasTienda.map(c => c.id_categoria);
      const productosTienda = (prodData || []).filter(p => idsCategoriasTienda.includes(p.id_categoria));

      setProductos(productosTienda);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="display-4 fw-bold text-coffee mb-3">Tienda</h1>
        <p className="lead text-muted">Café en grano, accesorios y más para tu hogar.</p>
      </div>

      {/* BARRA DE BÚSQUEDA */}
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

      {/* CARRUSEL DE CATEGORÍAS (PILLS) */}
      <div className="category-scroll-container mb-5">
        <button 
          className={`category-pill ${filtroCategoria === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroCategoria('todos')}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button 
            key={cat.id_categoria}
            className={`category-pill ${filtroCategoria == cat.id_categoria ? 'active' : ''}`}
            onClick={() => setFiltroCategoria(cat.id_categoria)}
          >
            {cat.nombre}
          </button>
        ))}
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