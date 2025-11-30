import { useState, useEffect } from 'react';
import { Card, Button, Form, Badge, Modal, Image } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaRegStar, FaUserCircle, FaCamera, FaTimes } from 'react-icons/fa';

const ResenasProducto = ({ idProducto }) => {
  const { user } = useAuth();
  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  
  const [puedeOpinar, setPuedeOpinar] = useState(false);
  const [yaOpino, setYaOpino] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const [rating, setRating] = useState(5);
  const [titulo, setTitulo] = useState('');
  const [comentario, setComentario] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const [imgModal, setImgModal] = useState(null);

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
      if (data.length > 0) {
        const suma = data.reduce((acc, curr) => acc + curr.calificacion, 0);
        setPromedio((suma / data.length).toFixed(1));
      }
      
      if (user) {
        const miResena = data.find(r => r.user_id === user.id);
        if (miResena) setYaOpino(true);
      }
    }
  };

  const verificarCompra = async () => {
    setVerificando(true);
    try {
      const { data } = await supabase
        .from('detalles_orden')
        .select(`id_orden, ordenes!inner (user_id, estado)`)
        .eq('id_producto', idProducto)
        .eq('ordenes.user_id', user.id)
        .eq('ordenes.estado', 'Completado')
        .limit(1);

      if (data && data.length > 0) setPuedeOpinar(true);
    } catch (error) { console.error(error); } finally { setVerificando(false); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + archivos.length > 3) return alert("Máximo 3 imágenes.");
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setArchivos(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const enviarResena = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !comentario.trim()) return alert("Completa todos los campos.");
    
    setEnviando(true);
    try {
      let urlsImagenes = [];
      if (archivos.length > 0) {
        for (const file of archivos) {
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          const { error: upErr } = await supabase.storage.from('resenas').upload(fileName, file);
          if (upErr) throw upErr;
          const { data } = supabase.storage.from('resenas').getPublicUrl(fileName);
          urlsImagenes.push(data.publicUrl);
        }
      }

      const { error } = await supabase.from('resenas').insert([{
        id_producto: idProducto,
        user_id: user.id,
        calificacion: rating,
        titulo: titulo,
        comentario: comentario,
        imagenes: urlsImagenes
      }]);

      if (error) throw error;
      
      setTitulo(''); setComentario(''); setArchivos([]); setPreviews([]);
      setYaOpino(true);
      cargarResenas();
      
    } catch (err) { alert(err.message); } finally { setEnviando(false); }
  };

  // CAMBIO: Color negro (#1a1a1a) para las estrellas
  const renderEstrellas = (valor) => [...Array(5)].map((_, i) => (
    <span key={i} style={{ color: valor >= i + 1 ? '#1a1a1a' : '#ccc' }}>
      {valor >= i + 1 ? <FaStar /> : <FaRegStar />}
    </span>
  ));

  return (
    <div className="mt-5 pt-4 border-top">
      <h3 className="mb-4 fw-bold text-coffee-title">Opiniones de Clientes</h3>

      <div className="d-flex align-items-center mb-4 gap-3">
        <div className="display-4 fw-bold text-coffee-dark">{promedio}</div>
        <div>
          {/* Estrellas negras en el resumen */}
          <div className="fs-5">{renderEstrellas(Math.round(promedio))}</div>
          <small className="text-muted">{resenas.length} reseñas</small>
        </div>
      </div>

      {user && !yaOpino && puedeOpinar && (
        <Card className="mb-5 border-0 shadow-sm bg-light animate-fade-in">
          <Card.Body>
            <h6 className="fw-bold mb-3">Escribe tu opinión</h6>
            <Form onSubmit={enviarResena}>
              <div className="mb-3">
                {/* Estrellas negras en el formulario */}
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    onClick={() => setRating(star)} 
                    style={{ cursor: 'pointer', fontSize: '1.5rem', color: star <= rating ? '#1a1a1a' : '#ccc' }} 
                    className="me-1"
                  >
                    ★
                  </span>
                ))}
              </div>
              <Form.Control type="text" placeholder="Título de la reseña" className="mb-3" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
              <Form.Control as="textarea" rows={3} placeholder="¿Qué te pareció el producto?" value={comentario} onChange={(e) => setComentario(e.target.value)} required className="mb-3"/>
              
              <div className="d-flex gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="position-relative" style={{width: 60, height: 60}}>
                    <img src={src} className="w-100 h-100 rounded object-fit-cover" />
                    <FaTimes className="position-absolute top-0 end-0 bg-danger text-white p-1 rounded-circle" style={{cursor:'pointer', transform:'translate(30%, -30%)'}} onClick={()=>{setArchivos(a=>a.filter((_,x)=>x!==i)); setPreviews(p=>p.filter((_,x)=>x!==i))}} />
                  </div>
                ))}
                {archivos.length < 3 && <label className="border rounded d-flex align-items-center justify-content-center bg-white" style={{width: 60, height: 60, cursor: 'pointer'}}><FaCamera className="text-secondary"/><input type="file" hidden accept="image/*" multiple onChange={handleFileChange}/></label>}
              </div>

              <Button type="submit" className="btn-coffee-pill border-0" disabled={enviando}>{enviando ? 'Publicando...' : 'Publicar Opinión'}</Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {user && yaOpino && <Alert variant="success" className="mb-4">¡Gracias por tu opinión!</Alert>}

      <div className="d-flex flex-column gap-4">
        {resenas.length > 0 ? resenas.map((r) => (
          <div key={r.id_resena} className="pb-3 border-bottom">
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex align-items-center gap-2">
                <FaUserCircle className="text-secondary fs-4" />
                <span className="fw-bold text-dark">Cliente Verificado</span>
              </div>
              <small className="text-muted">{new Date(r.fecha).toLocaleDateString()}</small>
            </div>
            {/* Estrellas negras en lista */}
            <div className="my-1 fs-6">{renderEstrellas(r.calificacion)}</div>
            {r.titulo && <h6 className="fw-bold mt-2">{r.titulo}</h6>}
            <p className="text-muted mb-2 small">{r.comentario}</p>
            {r.imagenes && r.imagenes.length > 0 && (
              <div className="d-flex gap-2 mt-2">
                {r.imagenes.map((img, i) => (
                  <Image key={i} src={img} rounded style={{width: 80, height: 80, objectFit: 'cover', cursor: 'pointer'}} onClick={() => setImgModal(img)} />
                ))}
              </div>
            )}
          </div>
        )) : <p className="text-muted">Aún no hay reseñas.</p>}
      </div>

      <Modal show={!!imgModal} onHide={() => setImgModal(null)} centered size="lg" contentClassName="bg-transparent border-0"><Modal.Body className="p-0 text-center"><Image src={imgModal} fluid rounded /></Modal.Body></Modal>
    </div>
  );
};

export default ResenasProducto;