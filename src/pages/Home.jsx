import { useEffect, useState } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/cliente';
import ProductCarousel from '../components/ProductCarousel';
import heroBackground from '../assets/hero_background.png';
import Historia from '../components/Historia';

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

  // Filtro para mostrar SOLO Café y Preparaciones en el Home
  // Ajusta las palabras clave según tus nombres reales de categoría
  const categoriasHome = categorias.filter(c => {
    const nombre = c.nombre.toLowerCase();
    return nombre.includes('grano') || nombre.includes('preparacion');
  });

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-section" style={{ 
        backgroundImage: `linear-gradient(rgba(44, 24, 16, 0.6), rgba(44, 24, 16, 0.4)), url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="hero-content animate-fade-in">
          <h1 className="display-3 fw-bold mb-3 text-white">CAFÉ DE ESPECIALIDAD</h1>
          <p className="lead mb-4 text-light fs-4" style={{ opacity: 0.9 }}>
            Directo del origen a tu taza en Valdivia.
          </p>
          
          {/* BOTÓN CON ESTILO PILL (IGUAL QUE ADMIN) */}
          <Link to="/catalogo" className="btn-coffee-pill" style={{ fontSize: '1.1rem', padding: '12px 40px' }}>
            Ver Tienda Completa
          </Link>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS (Solo Café y Preparaciones) */}
      <Container fluid="md" className="py-5 mb-5">
        {categoriasHome.map((cat) => {
          const prods = productos.filter(p => p.id_categoria === cat.id_categoria);
          if (prods.length === 0) return null;
          return <div key={cat.id_categoria} className="mb-5"><ProductCarousel title={cat.nombre} products={prods} /></div>;
        })}
      </Container>

      <Historia />

    </>
  );
}

export default Home;