import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Form, InputGroup, Image, Modal } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { FaStar, FaSearch, FaRegStar, FaUserCircle } from 'react-icons/fa';

function Resenas() {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [imgModal, setImgModal] = useState(null);
  const [filtroEstrellas, setFiltroEstrellas] = useState('todos');

  useEffect(() => {
    fetchResenas();
  }, []);

  const fetchResenas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resenas')
        .select(`*, productos (nombre, imagen)`)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setResenas(data || []);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderEstrellas = (calificacion) => [...Array(5)].map((_, i) => (
    <span key={i} className="review-star">{i < calificacion ? <FaStar /> : <FaRegStar />}</span>
  ));

  const resenasFiltradas = resenas.filter(r => {
    const termino = busqueda.toLowerCase().trim();
    const titulo = (r.titulo || '').toLowerCase();
    const comentario = (r.comentario || '').toLowerCase();
    const producto = (r.productos?.nombre || '').toLowerCase();

    const coincideTexto = !termino || titulo.includes(termino) || comentario.includes(termino) || producto.includes(termino);
    const coincideEstrella = filtroEstrellas === 'todos' || r.calificacion === parseInt(filtroEstrellas);

    return coincideTexto && coincideEstrella;
  });

  if (loading) return <Container className="mt-5 text-center py-5"><Spinner animation="border" variant="secondary"/></Container>;

  return (
    <Container className="my-5" style={{ maxWidth: '1200px' }}>
      <style>{`
        .resenas-header-title { color: #2C2C2C; font-weight: 800; letter-spacing: -0.5px; }
        
        /* Buscador Oscuro (Estilo Captura) */
        .search-bar-container { 
            background: #2C2C2C; /* Fondo oscuro */
            border-radius: 8px; 
            padding: 8px 16px; 
            border: 1px solid #444; 
            display: flex;
            align-items: center;
        }
        .search-input { 
            background: transparent !important; 
            border: none !important; 
            font-size: 1rem; 
            color: #ddd !important; /* Texto claro */
            box-shadow: none !important;
        }
        .search-input::placeholder { color: #888; }
        .search-icon { color: #eee; margin-right: 10px; font-size: 1.2rem; }
        
        /* Tarjeta */
        .review-card { border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; background: #fff; }
        .review-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .review-user-name { font-weight: 700; color: #333; font-size: 0.95rem; }
        .review-date { color: #999; font-size: 0.8rem; }
        .product-tag { display: inline-block; background: #F3F4F6; color: #6B7280; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 12px; }
        .review-star { color: #FFC107; font-size: 1.1rem; margin-right: 2px; }
        .review-title { font-weight: 700; color: #1F1F1F; margin-top: 10px; margin-bottom: 8px; line-height: 1.3; }
        .review-body { color: #555; font-size: 0.95rem; line-height: 1.6; }
        
        /* Collage */
        .review-thumb-box { width: 70px; height: 70px; border-radius: 10px; overflow: hidden; cursor: pointer; border: 1px solid #eee; }
        .review-thumb-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
        .review-thumb-box:hover .review-thumb-img { transform: scale(1.1); }
      `}</style>

      {/* Cabecera y Buscador */}
      <div className="text-center mb-5">
        <h2 className="resenas-header-title display-5 mb-4">RESEÑAS DESTACADAS</h2>
        
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <div className="search-bar-container">
              <FaSearch className="search-icon" />
              <Form.Control 
                type="text"
                placeholder="Buscar..." 
                className="search-input" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* Grid de Tarjetas */}
      <Row className="g-4">
        {resenasFiltradas.map((r) => (
          <Col key={r.id_resena} md={6} lg={4} className="d-flex align-items-stretch">
            <Card className="review-card h-100 p-4 d-flex flex-column w-100">
              
              {/* Cabecera Corregida */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaUserCircle size={32} className="text-secondary opacity-50"/>
                  <div>
                    <div className="review-user-name">Cliente Verificado</div>
                  </div>
                </div>
                <div className="review-date">{new Date(r.fecha).toLocaleDateString()}</div>
              </div> 
              {/* Fin Cabecera */}

              <div>
                <span className="product-tag">
                  {r.productos?.nombre || 'Producto General'}
                </span>
              </div>

              <div className="mb-2">{renderEstrellas(r.calificacion)}</div>
              
              {r.titulo && <h5 className="review-title">{r.titulo}</h5>}
              <p className="review-body flex-grow-1">{r.comentario}</p>

              {r.imagenes && r.imagenes.length > 0 && (
                <div className="d-flex gap-2 mt-3 pt-2 border-top">
                  {r.imagenes.slice(0, 3).map((imgUrl, idx) => (
                    <div key={idx} className="review-thumb-box" onClick={() => setImgModal(imgUrl)}>
                      <Image src={imgUrl} alt="review thumbnail" className="review-thumb-img" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        ))}
        
        {resenasFiltradas.length === 0 && (
          <Col className="text-center py-5">
            <p className="text-muted fs-5">No encontramos opiniones que coincidan con tu búsqueda.</p>
          </Col>
        )}
      </Row>

      <Modal show={!!imgModal} onHide={() => setImgModal(null)} centered size="lg" contentClassName="bg-transparent border-0 shadow-none">
        <Modal.Header closeButton className="border-0 filter-invert close-white" style={{zIndex: 1056}} ></Modal.Header>
        <Modal.Body className="p-0 text-center d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
          {imgModal && <Image src={imgModal} fluid rounded style={{maxHeight: '85vh', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}} />}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Resenas;