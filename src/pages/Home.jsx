import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/cliente';
import ProductCarousel from '../components/ProductCarousel';
import heroBackground from '../assets/hero_background.png';
import { FaFlask, FaAward, FaLeaf } from 'react-icons/fa';

function Home() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: prodData } = await supabase
          .from('productos')
          .select(`*, categoria:categoria!productos_id_categoria_fkey (id_categoria, nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
          .eq('estado', 'Publicado');

        const { data: catData } = await supabase.from('categoria').select('*');

        setProductos(prodData || []);
        setCategorias(catData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoriasHome = categorias.filter(c => {
    const nombre = c.nombre.toLowerCase();
    return nombre.includes('grano') || nombre.includes('preparacion');
  });

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{ 
        backgroundImage: `linear-gradient(rgba(44, 24, 16, 0.7), rgba(44, 24, 16, 0.5)), url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="hero-content animate-fade-in text-center px-4">
          <h1 className="display-2 fw-bold mb-3 text-white" style={{letterSpacing: '3px'}}>CAFÉ DE ESPECIALIDAD</h1>
          <p className="lead mb-5 text-light fs-4" style={{ maxWidth: '700px', margin: '0 auto', opacity: 0.9 }}>
            Ciencia, arte y pasión en cada tueste. Directo del origen a tu taza en Valdivia.
          </p>
          <Link to="/catalogo" className="btn-coffee-pill text-decoration-none" style={{ fontSize: '1.2rem', padding: '15px 50px' }}>
            Ver Tienda Online
          </Link>
        </div>
      </section>

      {/* 2. PRODUCTOS DESTACADOS */}
      <Container fluid="md" className="py-5">
        <div className="text-center mb-5">
          <span className="text-uppercase fw-bold" style={{color: 'var(--coffee-light)', letterSpacing: '2px'}}>Nuestros Granos</span>
          <h2 className="fw-bold text-coffee-dark display-6">Recién Tostados</h2>
        </div>
        {categoriasHome.map((cat) => {
          const prods = productos.filter(p => p.id_categoria === cat.id_categoria);
          if (prods.length === 0) return null;
          return (
            <div key={cat.id_categoria} className="mb-5">
              <ProductCarousel title={cat.nombre} products={prods} />
            </div>
          );
        })}
      </Container>

      {/* 3. HISTORIA Y PROCESO */}
      <section className="py-5">
        <Container>
          
          {/* INTRODUCCIÓN */}
          <Row className="align-items-center justify-content-center mb-5">
            <Col lg={8} className="text-center">
              <div style={{width: '60px', height: '3px', background: 'var(--coffee-accent)', margin: '0 auto 20px auto'}}></div>
              <h2 className="display-5 fw-bold mb-4" style={{color: 'var(--coffee-dark)'}}>Maestría y Experimentación</h2>
              <p className="fs-5 mb-5" style={{lineHeight: '1.8', color: '#4a3b32'}}>
                En <strong>Cafetería Especialidad Valdivia</strong>, nuestra historia no se cuenta en días, sino en perfiles de tueste perfeccionados. 
                Nos definimos como un <em>laboratorio de sabores</em> en el sur de Chile. 
                Nuestro enfoque es radicalmente experimental: seleccionamos meticulosamente granos verdes de micro-lotes exclusivos 
                y desafiamos los estándares convencionales para desbloquear notas sensoriales únicas.
              </p>

              <Row className="g-4 justify-content-center">
                <Col md={4}><div className="mb-2"><FaLeaf size={32} color="#5c3d2e"/></div><h6 className="fw-bold text-coffee-dark">Selección en Verde</h6></Col>
                <Col md={4}><div className="mb-2"><FaFlask size={32} color="#5c3d2e"/></div><h6 className="fw-bold text-coffee-dark">Tueste Experimental</h6></Col>
                <Col md={4}><div className="mb-2"><FaAward size={32} color="#5c3d2e"/></div><h6 className="fw-bold text-coffee-dark">Calidad Barista</h6></Col>
              </Row>
            </Col>
          </Row>

          {/* DETALLE DEL PROCESO - IMÁGENES SIN BORDE BLANCO */}
          
          {/* Bloque 1: Grano Verde */}
          <Row className="align-items-center mb-5 g-5">
            <Col lg={6}>
              {/* QUITÉ: border border-2 border-white */}
              <div className="rounded-4 overflow-hidden shadow-lg">
                <Image src="https://qnpdzmzlfbffdommcdkc.supabase.co/storage/v1/object/public/assets/cafe_verde.jpg" fluid className="w-100" style={{objectFit: 'cover', height: '350px'}} />
              </div>
            </Col>
            <Col lg={6}>
              <h3 className="fw-bold text-coffee-dark mb-3">Cosecha del año: Verde Esmeralda</h3>
              <p style={{lineHeight: '1.7', fontSize: '1.1rem', color: '#3e3e3e'}}>
                Todo comienza mucho antes del aroma. Para nosotros, el café de especialidad nace en la selección rigurosa del grano en verde. 
                Buscamos esa tonalidad <strong>"verde esmeralda"</strong> perfecta, libre de defectos primarios.
                <br/><br/>
                No trabajamos con café comercial; trabajamos con micro-lotes que superan los <strong>80 puntos en taza</strong>. 
                En el mundo del café no corre la palabra "gourmet", aquí hablamos de Especialidad real y trazable.
              </p>
            </Col>
          </Row>

          {/* Bloque 2: El Tostado */}
          <Row className="align-items-center mb-5 g-5 flex-lg-row-reverse">
            <Col lg={6}>
              <div className="rounded-4 overflow-hidden shadow-lg">
                <Image src="https://qnpdzmzlfbffdommcdkc.supabase.co/storage/v1/object/public/assets/cafe_tostado.jpg" fluid className="w-100" style={{objectFit: 'cover', height: '350px'}} />
              </div>
            </Col>
            <Col lg={6}>
              <h3 className="fw-bold text-coffee-dark mb-3">El Arte del Tueste Experimental</h3>
              <p style={{lineHeight: '1.7', fontSize: '1.1rem', color: '#3e3e3e'}}>
                Aquí es donde ocurre la magia. Desarrollamos una <strong>curva de tueste específica</strong> para cada origen, 
                manipulando temperatura y flujo de aire para resaltar las características intrínsecas del grano.
                <br/><br/>
                Nuestro tueste es "experimental" porque buscamos el punto dulce exacto donde la acidez brillante y el dulzor se encuentran, 
                evitando siempre los sabores quemados o amargos. Es química aplicada a la felicidad.
              </p>
            </Col>
          </Row>

          {/* Bloque 3: Chaff y Sustentabilidad */}
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <div className="rounded-4 overflow-hidden shadow-lg">
                <Image src="https://qnpdzmzlfbffdommcdkc.supabase.co/storage/v1/object/public/assets/DSCF0948.jpg" fluid className="w-100" style={{objectFit: 'cover', height: '350px'}} />
              </div>
            </Col>
            <Col lg={6}>
              <h3 className="fw-bold text-coffee-dark mb-3">¿Sabías qué? El Chaff y la Vida</h3>
              <p style={{lineHeight: '1.7', fontSize: '1.1rem', color: '#3e3e3e'}}>
                Como resultado del proceso de tueste se obtiene el <em>chaff</em> (cascarilla). 
                Removerlo asegura perfiles más limpios en taza, pero en lugar de desecharlo, cerramos el ciclo.
                <br/><br/>
                Este residuo orgánico rico en nitrógeno se lo entregamos a <strong>Planeta Musgo</strong>, quienes lo reutilizan 
                para crear sustratos para <em>kokedamas</em>. Tu café no solo te despierta a ti, también nutre nuevas plantas.
              </p>
            </Col>
          </Row>

        </Container>
      </section>
    </>
  );
}

export default Home;