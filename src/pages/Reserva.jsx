import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import ProductCard from '../components/ProductCard';
import './Catalogo.css'; // Reutilizamos los estilos del carrusel de categorías

function Reserva() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  // Helper para identificar qué es una preparación (LÓGICA CLAVE)
  const esPreparacion = (nombreCat) => {
    const n = nombreCat.toLowerCase();
    return n.includes('preparación') || n.includes('filtrado') || n.includes('bebida') || n.includes('barra');
  };

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        // 1. Obtener todas las categorías
        const { data: catData } = await supabase.from('categoria').select('*');
        
        // 2. Filtrar SOLO las que son preparaciones para crear los botones
        const categoriasMenu = (catData || []).filter(c => esPreparacion(c.nombre));
        setCategorias(categoriasMenu);

        const idsMenu = categoriasMenu.map(c => c.id_categoria);

        // 3. Obtener productos asociados a esas categorías
        const { data: prodData } = await supabase
          .from('productos')
          .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
          .eq('estado', 'Publicado')
          .in('id_categoria', idsMenu) 
          .order('id_producto', { ascending: false });

        setProductos(prodData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Filtrado visual
  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria === 'todos') return true;
    return p.id_categoria === filtroCategoria;
  });

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-coffee mb-3">Menú & Reserva</h1>
        <p className="lead text-muted">Disfruta de nuestras preparaciones de especialidad.</p>
        <Alert variant="info" className="d-inline-block px-4 py-2 rounded-pill mb-4">
          📅 Próximamente: Reserva tu mesa desde aquí.
        </Alert>
      </div>

      {/* FILTROS DE CATEGORÍA (Dinámicos) */}
      <div className="category-scroll-container mb-5 justify-content-center">
        <button 
          className={`category-pill ${filtroCategoria === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroCategoria('todos')}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button 
            key={cat.id_categoria}
            className={`category-pill ${filtroCategoria === cat.id_categoria ? 'active' : ''}`}
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
          <div className="text-center py-5 text-muted w-100">
            <h4>No hay preparaciones en esta categoría por el momento.</h4>
          </div>
        )}
      </Row>
    </Container>
  );
}

export default Reserva;