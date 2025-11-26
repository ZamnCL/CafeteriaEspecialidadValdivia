import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Tab, Tabs, Table, Modal, Alert } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function MiCuenta() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [perfil, setPerfil] = useState({ nombre: '', direccion: '', telefono: '' });
  const [ordenes, setOrdenes] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  // Estados para Reseña
  const [showModal, setShowModal] = useState(false);
  const [reseñaData, setReseñaData] = useState({ id_producto: null, nombre_producto: '', calificacion: 5, comentario: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar Perfil (Datos de envío)
      const { data: dataPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (dataPerfil) setPerfil(dataPerfil);

      // 2. Cargar Órdenes con Detalles
      const { data: dataOrdenes } = await supabase
        .from('ordenes')
        .select(`*, detalles_orden(*)`)
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });

      setOrdenes(dataOrdenes || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- GUARDAR PERFIL ---
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('perfiles')
      .upsert({ id: user.id, ...perfil }); // Upsert crea o actualiza

    if (error) setMsg({ type: 'danger', text: 'Error al guardar.' });
    else setMsg({ type: 'success', text: 'Información guardada correctamente.' });
  };

  // --- RESEÑAS ---
  const abrirModalReseña = (detalle) => {
    setReseñaData({
      id_producto: detalle.id_producto,
      nombre_producto: detalle.nombre_producto, // Asumiendo que guardaste el nombre en detalles_orden
      calificacion: 5,
      comentario: ''
    });
    setShowModal(true);
  };

  const enviarReseña = async () => {
    const { error } = await supabase.from('resenas').insert([{
      user_id: user.id,
      id_producto: reseñaData.id_producto,
      calificacion: parseInt(reseñaData.calificacion),
      comentario: reseñaData.comentario
    }]);

    if (error) alert("Error enviando reseña: " + error.message);
    else {
      alert("¡Gracias por tu opinión!");
      setShowModal(false);
    }
  };

  if (loading) return <Container className="mt-5 text-center">Cargando...</Container>;

  return (
    <Container className="my-5">
      <h2 className="mb-4">Mi Cuenta</h2>
      {msg.text && <Alert variant={msg.type} dismissible onClose={()=>setMsg({})}>{msg.text}</Alert>}

      <Tabs defaultActiveKey="pedidos" className="mb-4">
        
        {/* --- TAB 1: MIS PEDIDOS --- */}
        <Tab eventKey="pedidos" title="Mis Pedidos">
          {ordenes.length === 0 ? <p>No tienes pedidos aún.</p> : (
            ordenes.map(orden => (
              <Card key={orden.id_orden} className="mb-3 shadow-sm border-0">
                <Card.Header className="d-flex justify-content-between bg-white fw-bold">
                  <span>Pedido #{orden.id_orden.toString().slice(0,8)}...</span>
                  <span>{new Date(orden.fecha).toLocaleDateString()}</span>
                  <span className={orden.estado === 'Pagado' ? 'text-success' : 'text-warning'}>
                    {orden.estado}
                  </span>
                </Card.Header>
                <Card.Body>
                  <Table size="sm" borderless>
                    <tbody>
                      {orden.detalles_orden?.map((d, idx) => (
                        <tr key={idx} className="border-bottom">
                          <td>{d.nombre_producto} <small className="text-muted">({d.formato_nombre})</small></td>
                          <td>x{d.cantidad}</td>
                          <td className="text-end">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-decoration-none"
                              onClick={() => abrirModalReseña(d)}
                            >
                              ★ Opinar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-end fw-bold mt-2">
                    Total: ${orden.total.toLocaleString()}
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Tab>

        {/* --- TAB 2: MIS DATOS --- */}
        <Tab eventKey="datos" title="Mis Datos de Envío">
          <Card className="border-0 shadow-sm p-4">
            <Form onSubmit={handleGuardarPerfil}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre Completo</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={perfil.nombre || ''} 
                      onChange={e => setPerfil({...perfil, nombre: e.target.value})} 
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={perfil.telefono || ''} 
                      onChange={e => setPerfil({...perfil, telefono: e.target.value})} 
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Dirección de Envío</Form.Label>
                <Form.Control 
                  type="text" 
                  value={perfil.direccion || ''} 
                  onChange={e => setPerfil({...perfil, direccion: e.target.value})} 
                  placeholder="Calle, Número, Comuna"
                />
              </Form.Group>
              <Button variant="dark" type="submit">Guardar Información</Button>
            </Form>
          </Card>
        </Tab>
      </Tabs>

      {/* MODAL DE RESEÑA */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Opinar sobre {reseñaData.nombre_producto}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Calificación</Form.Label>
              <div className="fs-3 text-warning cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    onClick={() => setReseñaData({...reseñaData, calificacion: star})}
                    style={{cursor: 'pointer'}}
                  >
                    {star <= reseñaData.calificacion ? '★' : '☆'}
                  </span>
                ))}
              </div>
            </Form.Group>
            <Form.Group>
              <Form.Label>Tu comentario</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={reseñaData.comentario}
                onChange={e => setReseñaData({...reseñaData, comentario: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="dark" onClick={enviarReseña}>Enviar Reseña</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}

export default MiCuenta;