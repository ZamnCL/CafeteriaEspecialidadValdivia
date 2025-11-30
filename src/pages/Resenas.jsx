import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Badge, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { FaStar, FaSearch, FaRegStar, FaUserCircle, FaImage } from 'react-icons/fa';

function Resenas() {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstrellas, setFiltroEstrellas] = useState('todos');

  useEffect(() => {
    fetchResenas();
  }, []);

  const fetchResenas = async () => {
    setLoading(true);
    try {
      // Traemos la reseña y los datos del producto relacionado
      const { data, error } = await supabase
        .from('resenas')
        .select(`
          *,
          productos (
            nombre,
            imagen
          )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setResenas(data || []);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para renderizar estrellas
  const renderEstrellas = (calificacion) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < calificacion ? '#ffc107' : '#e4e5e9' }}>
        {i < calificacion ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  // Filtrado
  const resenasFiltradas = resenas.filter(r => {
    const coincideTexto = r.productos?.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          r.comentario?.toLowerCase().includes(busqueda.toLowerCase()) ||
                          r.titulo?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstrella = filtroEstrellas === 'todos' || r.calificacion === parseInt(filtroEstrellas);

    return coincideTexto && coincideEstrella;
  });

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" variant="secondary"/></Container>;

  return (
    <Container className="my-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-coffee-dark display-6">Opiniones de la Comunidad</h2>
        <p className="text-muted">Lo que dicen nuestros Coffee Lovers.</p>
      </div>

      {/* FILTROS */}
      <Card className="border-0 shadow-sm mb-5 bg-light">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-0"><FaSearch className="text-muted"/></InputGroup.Text>
                <Form.Control 
                  placeholder="Buscar por producto o comentario..." 
                  className="border-0 shadow-none"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select 
                className="border-0 shadow-none" 
                value={filtroEstrellas}
                onChange={(e) => setFiltroEstrellas(e.target.value)}
              >
                <option value="todos">Todas las calificaciones</option>
                <option value="5">5 Estrellas (Excelente)</option>
                <option value="4">4 Estrellas (Muy Bueno)</option>
                <option value="3">3 Estrellas (Bueno)</option>
                <option value="2">2 Estrellas (Regular)</option>
                <option value="1">1 Estrella (Malo)</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* LISTA DE RESEÑAS */}
      <Row className="g-4">
        {resenasFiltradas.map((r) => (
          <Col key={r.id_resena} md={6} lg={4}>
            <Card className="h-100 border-0 shadow-sm hover-scale" style={{transition: 'transform 0.2s'}}>
              <Card.Body>
                {/* Encabezado: Usuario y Fecha */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <FaUserCircle size={24} className="text-secondary"/>
                    <small className="fw-bold text-dark">{r.nombre_usuario || 'Anónimo'}</small>
                    <Badge bg="success" style={{fontSize: '0.6rem', opacity: 0.8}}>Compra Verificada</Badge>
                  </div>
                  <small className="text-muted" style={{fontSize: '0.75rem'}}>
                    {new Date(r.fecha).toLocaleDateString()}
                  </small>
                </div>

                {/* Producto Reseñado */}
                <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded" style={{backgroundColor: '#f8f9fa'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden'}}>
                    {r.productos?.imagen ? (
                      <img src={r.productos.imagen} alt="prod" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                    ) : <div className="bg-secondary w-100 h-100"></div>}
                  </div>
                  <small className="fw-bold text-coffee-dark lh-1">{r.productos?.nombre}</small>
                </div>

                {/* Estrellas y Título */}
                <div className="mb-2 fs-5">{renderEstrellas(r.calificacion)}</div>
                {r.titulo && <h6 className="fw-bold mb-2">{r.titulo}</h6>}
                
                {/* Comentario */}
                <p className="text-muted small mb-3" style={{lineHeight: '1.6'}}>
                  {r.comentario}
                </p>

                {/* Imágenes de la reseña (Si tiene) */}
                {r.imagenes && r.imagenes.length > 0 && (
                  <div className="d-flex gap-2 mt-3">
                    {r.imagenes.map((imgUrl, idx) => (
                      <div key={idx} style={{width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #eee'}}>
                        <img src={imgUrl} alt="review" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
        
        {resenasFiltradas.length === 0 && (
          <Col className="text-center py-5">
            <p className="text-muted fs-5">No se encontraron reseñas con esos filtros.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Resenas;