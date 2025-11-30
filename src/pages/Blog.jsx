import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Image, Spinner } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { FaCalendarAlt, FaUserTie } from 'react-icons/fa';

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error("Error cargando blog:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Container className="mt-5 text-center py-5"><Spinner animation="border" variant="secondary"/></Container>;

  return (
    <Container className="my-5" style={{ maxWidth: '1200px' }}>
      <style>{`
        .blog-title-main { color: var(--coffee-dark); font-weight: 800; letter-spacing: -0.5px; }
        
        /* Tarjeta Horizontal */
        .blog-horizontal-card {
            border: none;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            background: #fff;
        }
        
        .blog-horizontal-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(92, 61, 46, 0.15);
        }

        /* Contenedor de Imagen Cuadrada (1x1) */
        .blog-img-square-container {
            width: 240px; /* Ancho fijo para que sea horizontal */
            flex-shrink: 0; /* Evita que se encoja */
            position: relative;
            background-color: #f8f9fa;
        }

        .blog-img-square {
            width: 100%;
            height: 100%;
            object-fit: cover; /* Cubre el área sin deformar */
            aspect-ratio: 1 / 1; /* Fuerza la relación de aspecto cuadrada */
            transition: transform 0.5s ease;
        }
        
        .blog-horizontal-card:hover .blog-img-square {
            transform: scale(1.03);
        }

        /* Contenedor de Texto */
        .blog-content-box {
            padding: 1.5rem 2rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .blog-meta { color: #999; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8rem; }
        .blog-heading { color: #2c2c2c; font-weight: 800; font-size: 1.4rem; margin-bottom: 1rem; line-height: 1.3; }
        .blog-text { color: #555; line-height: 1.7; font-size: 0.95rem; white-space: pre-line; }

        /* Responsive: En móviles se apila verticalmente */
        @media (max-width: 768px) {
             .blog-horizontal-card .d-flex {
                 flex-direction: column;
             }
             .blog-img-square-container {
                 width: 100%; /* Ancho completo */
                 height: auto;
                 aspect-ratio: 16 / 9; /* Opcional: más rectangular en móvil */
             }
             .blog-content-box {
                 padding: 1.5rem;
             }
        }
      `}</style>

      <div className="text-center mb-5 pb-3">
        <h6 className="text-uppercase text-muted fw-bold ls-2 mb-2" style={{letterSpacing: '2px'}}>Nuestras Historias</h6>
        <h2 className="blog-title-main display-5">BLOG CAFETERO</h2>
      </div>

      {/* Grid de 2 columnas (md={6}) */}
      <Row className="g-4">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <Col md={6} key={blog.id}>
              <Card className="blog-horizontal-card h-100">
                {/* Usamos d-flex para alinear imagen y texto horizontalmente */}
                <div className="d-flex h-100 align-items-stretch">
                  
                  {/* Lado Izquierdo: Imagen Cuadrada */}
                  <div className="blog-img-square-container">
                    {blog.imagen ? (
                      <Image src={blog.imagen} alt={blog.titulo} className="blog-img-square" />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted fw-bold" style={{aspectRatio: '1/1'}}>Sin Imagen</div>
                    )}
                  </div>

                  {/* Lado Derecho: Contenido */}
                  <div className="blog-content-box flex-grow-1">
                    <div className="blog-meta d-flex align-items-center gap-3">
                      <span><FaCalendarAlt className="me-2" style={{color: '#c4a484'}}/> {new Date(blog.fecha_creacion).toLocaleDateString()}</span>
                      <span><FaUserTie className="me-2" style={{color: '#c4a484'}}/> Admin</span>
                    </div>
                    <h3 className="blog-heading">{blog.titulo}</h3>
                    {/* Recortamos el texto si es muy largo para la vista previa */}
                    <div className="blog-text">
                      {blog.contenido.length > 150 ? blog.contenido.substring(0, 150) + '...' : blog.contenido}
                    </div>
                  </div>

                </div>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="text-center py-5 text-muted bg-light rounded-3">
              <h4>Pronto publicaremos nuevas historias.</h4>
              <p>Estamos preparando el mejor contenido para ti.</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Blog;