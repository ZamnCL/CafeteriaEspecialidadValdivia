import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../supabase/cliente'; 
import ProductCard from '../components/ProductCard';
import { FaClock, FaMugHot } from 'react-icons/fa';

function Reserva() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  // --- FILTRO DE CATEGORÍAS PARA BARRA ---
  // Solo incluimos lo que se prepara/sirve en el momento.
  const esDeReserva = (nombreCat) => {
    if (!nombreCat) return false;
    const n = nombreCat.toLowerCase();
    
    // NOTA: He quitado 'cafeteras' para que no salgan las máquinas de venta
    return n.includes('preparación') || 
           n.includes('filtrado') || 
           n.includes('bebida') || 
           n.includes('barra') ||
           n.includes('métodos') ||
           n.includes('servicio') ||
           n.includes('pastelería') ||
           n.includes('sandwich');
  };

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        // 1. Traemos todas las categorías
        const { data: catData } = await supabase.from('categoria').select('*');
        
        // 2. Filtramos solo las categorías de servicio/barra
        const categoriasPermitidas = (catData || []).filter(c => esDeReserva(c.nombre));
        setCategorias(categoriasPermitidas);

        const idsPermitidos = categoriasPermitidas.map(c => c.id_categoria);

        // 3. Traemos los productos de esas categorías específicas
        if (idsPermitidos.length > 0) {
            const { data: prodData } = await supabase
            .from('productos')
            .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
            .eq('estado', 'Publicado')
            .in('id_categoria', idsPermitidos)
            .order('id_producto', { ascending: false });

            setProductos(prodData || []);
        } else {
            setProductos([]);
        }
      } catch (error) {
        console.error("Error al cargar menú de reserva:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Filtrado visual por botones
  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria === 'todos') return true;
    return p.id_categoria === filtroCategoria;
  });

  if (loading) {
    return (
      <Container className="mt-5 text-center py-5">
        <Spinner animation="border" variant="secondary"/>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-5 animate-fade-in">
        <h1 className="display-4 fw-bold mb-3" style={{color: 'var(--coffee-dark, #5c3d2e)'}}>
            <FaMugHot className="me-3" />
            Barra & Retiro
        </h1>
        <p className="lead text-muted mb-4">
            Pide tus preparaciones favoritas y retíralas listas para disfrutar.
        </p>
        
        <Alert variant="warning" className="d-inline-block px-4 py-3 rounded-4 border-0 shadow-sm text-start">
          <div className="d-flex align-items-center mb-2 fw-bold">
             <FaClock className="me-2" /> ¿Cómo funciona?
          </div>
          <ul className="mb-0 small text-muted" style={{listStyleType: 'circle'}}>
             <li>Selecciona tu bebida o preparación.</li>
             <li>Elige la hora exacta de retiro.</li>
             <li>Paga online y ¡listo! Sin filas.</li>
          </ul>
        </Alert>
      </div>

      {/* BOTONES DE FILTRO */}
      {categorias.length > 0 && (
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
          <button 
            className={`btn rounded-pill px-4 fw-bold ${filtroCategoria === 'todos' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setFiltroCategoria('todos')}
          >
            Todo
          </button>
          {categorias.map(cat => (
            <button 
              key={cat.id_categoria}
              className={`btn rounded-pill px-4 fw-bold ${filtroCategoria === cat.id_categoria ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFiltroCategoria(cat.id_categoria)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* GRID DE PRODUCTOS */}
      <Row className="g-4">
        {productosFiltrados.map(prod => (
          <Col key={prod.id_producto} sm={6} md={4} lg={3}>
            
            <div className="h-100 position-relative">
                {/* Doble prop para seguridad */}
                <ProductCard product={prod} producto={prod} />
                
                <Badge bg="warning" text="dark" className="position-absolute top-0 start-0 m-3 shadow-sm border border-light">
                    <FaClock className="me-1"/> Con Reserva
                </Badge>
            </div>

          </Col>
        ))}
        
        {productosFiltrados.length === 0 && (
          <div className="text-center py-5 text-muted w-100">
            <h4>No hay productos de barra disponibles en este momento.</h4>
          </div>
        )}
      </Row>
    </Container>
  );
}

export default Reserva;