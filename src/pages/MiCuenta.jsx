import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Tab, Tabs, Table, Modal, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import "./MiCuenta.css";

function MiCuenta() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState({ nombre: '', direccion: '', telefono: '' });
  const [ordenes, setOrdenes] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

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
      const { data: dataPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (dataPerfil) setPerfil(dataPerfil);

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

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('perfiles')
      .upsert({ id: user.id, ...perfil });

    if (error) setMsg({ type: 'danger', text: 'Error al guardar.' });
    else setMsg({ type: 'success', text: 'Información guardada correctamente.' });
  };

  const abrirModalReseña = (detalle) => {
    setReseñaData({
      id_producto: detalle.id_producto,
      nombre_producto: detalle.nombre_producto,
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
    <Container className="my-5 miCuenta-container">

      <h2 className="miCuenta-title mb-4">Mi Cuenta</h2>

      {msg.text && <Alert variant={msg.type} dismissible onClose={()=>setMsg({})}>{msg.text}</Alert>}

      <Tabs defaultActiveKey="pedidos" className="mb-4 miCuenta-tabs">

        <Tab eventKey="pedidos" title="Mis Pedidos">
          {ordenes.length === 0 ? (
            <p className="text-muted">No tienes pedidos aún.</p>
          ) : (
            ordenes.map(orden => (
              <Card key={orden.id_orden} className="mb-3 miCuenta-card border-0">
                
                <Card.Header className="d-flex justify-content-between miCuenta-card-header align-items-center">
                  <span>Pedido #{orden.id_orden.toString().slice(0,8)}...</span>

                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted small fw-normal">
                      {new Date(orden.fecha).toLocaleDateString()}
                    </span>

                    <Badge
                      bg={
                        orden.estado === 'Completado' ? 'success' : 
                        orden.estado === 'Rechazado' ? 'danger' : 
                        'warning'
                      }
                      text="dark"
                      className="px-3"
                    >
                      {orden.estado === 'Por Confirmar' ? 'Pendiente' : orden.estado}
                    </Badge>
                  </div>
                </Card.Header>

                <Card.Body>
                  <Table size="sm" responsive className="miCuenta-table">
                    <tbody>
                      {orden.detalles_orden?.map((d, idx) => (
                        <tr key={idx} className="align-middle">
                          <td>
                            <span className="miCuenta-product-title">{d.nombre_producto}</span>
                            <br />
                            <small className="miCuenta-product-category">{d.formato_nombre}</small>
                          </td>

                          <td>x{d.cantidad}</td>

                          <td className="text-end">
                            <Button
                              className="miCuenta-btn-opinar"
                              size="sm"
                              onClick={() => abrirModalReseña(d)}
                              disabled={orden.estado !== 'Completado'}
                              style={{
                                opacity: orden.estado !== 'Completado' ? 0.4 : 1,
                                cursor: orden.estado !== 'Completado' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              ★ Opinar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="text-end fw-bold mt-2 miCuenta-total">
                    Total: ${orden.total.toLocaleString()}
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Tab>

        <Tab eventKey="datos" title="Mis Datos de Envío">
          <Card className="miCuenta-card p-4">
            <Form onSubmit={handleGuardarPerfil}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="miCuenta-label">Nombre Completo</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={perfil.nombre || ''} 
                      onChange={e => setPerfil({...perfil, nombre: e.target.value})} 
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="miCuenta-label">Teléfono</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={perfil.telefono || ''} 
                      onChange={e => setPerfil({...perfil, telefono: e.target.value})} 
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="miCuenta-label">Dirección de Envío</Form.Label>
                <Form.Control 
                  type="text" 
                  value={perfil.direccion || ''} 
                  onChange={e => setPerfil({...perfil, direccion: e.target.value})} 
                  placeholder="Calle, Número, Comuna"
                />
              </Form.Group>

              <Button className="miCuenta-btn-guardar mt-2" type="submit">
                Guardar Información
              </Button>
            </Form>
          </Card>
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <div className="miCuenta-card p-2" style={{ borderRadius: "12px" }}>
          <Modal.Header closeButton className="miCuenta-card-header">
            <Modal.Title className="miCuenta-title">
              Opinar sobre {reseñaData.nombre_producto}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="miCuenta-label">Calificación</Form.Label>
                <div className="fs-3 miCuenta-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      onClick={() => setReseñaData({...reseñaData, calificacion: star})}
                    >
                      {star <= reseñaData.calificacion ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </Form.Group>

              <Form.Group>
                <Form.Label className="miCuenta-label">Tu comentario</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={reseñaData.comentario}
                  onChange={e => setReseñaData({...reseñaData, comentario: e.target.value})}
                />
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer className="d-flex justify-content-between">
            <Button className="miCuenta-btn-cancelar" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button className="miCuenta-btn-guardar" onClick={enviarReseña}>
              Enviar Reseña
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

    </Container>
  );
}

export default MiCuenta;
