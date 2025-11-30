import { useState, useEffect } from 'react';
import { Card, Button, Form, ProgressBar, Badge } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUserCircle } from 'react-icons/fa';

const ResenasProducto = ({ idProducto }) => {
  const { user } = useAuth();
  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  
  // Estados de verificación
  const [puedeOpinar, setPuedeOpinar] = useState(false);
  const [yaOpino, setYaOpino] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // Formulario
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarResenas();
    if (user) verificarCompra();
  }, [idProducto, user]);

  const cargarResenas = async () => {
    const { data } = await supabase
      .from('resenas')
      .select('*')
      .eq('id_producto', idProducto)
      .order('fecha', { ascending: false });

    if (data) {
      setResenas(data);
      // Calcular promedio
      if (data.length > 0) {
        const suma = data.reduce((acc, curr) => acc + curr.calificacion, 0);
        setPromedio((suma / data.length).toFixed(1));
      }
      
      // Verificar si el usuario ya opinó
      if (user) {
        const miResena = data.find(r => r.user_id === user.id);
        if (miResena) setYaOpino(true);
      }
    }
  };

  // --- LÓGICA DE VERIFICACIÓN CRUZADA ---
  const verificarCompra = async () => {
    setVerificando(true);
    try {
      // Buscamos en los detalles de ordenes
      // Que coincidan con el producto Y que la orden padre esté COMPLETADA y sea del USUARIO
      const { data, error } = await supabase
        .from('detalles_orden')
        .select(`
          id_orden,
          ordenes!inner (
            user_id,
            estado
          )
        `)
        .eq('id_producto', idProducto)
        .eq('ordenes.user_id', user.id)
        .eq('ordenes.estado', 'Completado') // Solo si ya finalizó la compra
        .limit(1);

      if (data && data.length > 0) {
        setPuedeOpinar(true);
      }
    } catch (error) {
      console.error("Error verificando compra:", error);
    } finally {
      setVerificando(false);
    }
  };

  const enviarResena = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return alert("Escribe un comentario.");
    
    setEnviando(true);
    try {
      const { error } = await supabase.from('resenas').insert([{
        id_producto: idProducto,
        user_id: user.id,
        nombre_usuario: user.user_metadata?.nombre || 'Cliente',
        calificacion: rating,
        comentario: comentario
      }]);

      if (error) throw error;
      
      setComentario('');
      setYaOpino(true);
      cargarResenas(); // Recargar lista
      
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  // Helper para estrellas
  const renderEstrellas = (valor) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: '#ffc107' }}>
        {valor >= i + 1 ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  return (
    <div className="mt-5 pt-4 border-top">
      <h3 className="mb-4 fw-bold text-coffee-title">Opiniones de Clientes</h3>

      {/* Resumen */}
      <div className="d-flex align-items-center mb-4 gap-3">
        <div className="display-4 fw-bold text-coffee-dark">{promedio}</div>
        <div>
          <div className="text-warning">{renderEstrellas(Math.round(promedio))}</div>
          <small className="text-muted">{resenas.length} reseñas</small>
        </div>
      </div>

      {/* Formulario (Solo si cumple condiciones) */}
      {user && !yaOpino && puedeOpinar && (
        <Card className="mb-5 border-0 shadow-sm bg-light">
          <Card.Body>
            <h6 className="fw-bold mb-3">¿Qué te pareció este producto?</h6>
            <Form onSubmit={enviarResena}>
              <div className="mb-3">
                <label className="me-2 fw-bold text-muted">Calificación:</label>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    onClick={() => setRating(star)} 
                    style={{ cursor: 'pointer', fontSize: '1.2rem', color: star <= rating ? '#ffc107' : '#ddd' }}
                    className="me-1"
                  >
                    ★
                  </span>
                ))}
              </div>
              <Form.Group className="mb-3">
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Comparte tu experiencia..." 
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" className="btn-coffee-pill border-0" disabled={enviando}>
                {enviando ? 'Publicando...' : 'Publicar Opinión'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Mensajes de estado para el usuario */}
      {user && !puedeOpinar && !yaOpino && !verificando && (
        <div className="alert alert-secondary small">
          Solo puedes opinar sobre productos que has comprado y recibido.
        </div>
      )}
      {user && yaOpino && (
        <div className="alert alert-success small">
          ¡Gracias por compartir tu opinión sobre este producto!
        </div>
      )}

      {/* Lista de Reseñas */}
      <div className="d-flex flex-column gap-3">
        {resenas.length > 0 ? (
          resenas.map((r) => (
            <div key={r.id_resena} className="pb-3 border-bottom">
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-center gap-2">
                  <FaUserCircle className="text-secondary fs-4" />
                  <span className="fw-bold text-dark">{r.nombre_usuario}</span>
                  {/* Badge de Compra Verificada (Visual) */}
                  <Badge bg="success" className="ms-2" style={{fontSize: '0.6rem'}}>Compra Verificada</Badge>
                </div>
                <small className="text-muted">{new Date(r.fecha).toLocaleDateString()}</small>
              </div>
              <div className="my-1 text-warning small">{renderEstrellas(r.calificacion)}</div>
              <p className="text-muted mb-0 small">{r.comentario}</p>
            </div>
          ))
        ) : (
          <p className="text-muted">Aún no hay reseñas. ¡Sé el primero en opinar!</p>
        )}
      </div>
    </div>
  );
};

export default ResenasProducto;