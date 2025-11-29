import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Tab, Tabs, Table, Modal, Alert, Badge, Card } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import "./MiCuenta.css";

function MiCuenta() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState({ nombre: '', direccion: '', telefono: '' });
  const [ordenes, setOrdenes] = useState([]);
  const [precios, setPrecios] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const [detalleModal, setDetalleModal] = useState(null);

  const [showResenaModal, setShowResenaModal] = useState(false);
  const [reseñaData, setReseñaData] = useState({
    id_producto: null,
    nombre_producto: '',
    calificacion: 5,
    comentario: ''
  });

  // NUEVO ESTADO para búsqueda
  const [busqueda, setBusqueda] = useState('');

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

      const { data: productos } = await supabase
        .from('productos')
        .select('id_producto, precio');

      const mapaPrecios = {};
      productos?.forEach(p => { mapaPrecios[p.id_producto] = p.precio });

      setPrecios(mapaPrecios);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const manejarGuardarPerfil = async (e) => {
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
    setShowResenaModal(true);
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
      setShowResenaModal(false);
    }
  };

  if (loading) return <Container className="mt-5 text-center">Cargando...</Container>;

  return (
    <Container className="my-5 miCuenta-container">

      <h2 className="miCuenta-title mb-4">Mi Cuenta</h2>

      {msg.text && (
        <Alert variant={msg.type} dismissible onClose={() => setMsg({})}>
          {msg.text}
        </Alert>
      )}

      <Tabs defaultActiveKey="pedidos" className="mb-4 miCuenta-tabs">

        <Tab eventKey="pedidos" title="Mis Pedidos">

          {ordenes.length === 0 ? (
            <Card className="miCuenta-card p-4 text-center">
              <p className="text-muted mb-0">No tienes pedidos aún.</p>
            </Card>
          ) : (
            <Card className="miCuenta-card mb-4">
              <Card.Header className="miCuenta-card-header">
                <h5 className="mb-0">Todos mis pedidos</h5>
              </Card.Header>

              <Card.Body>
                {/* BARRA DE BÚSQUEDA */}
                <Form className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </Form>

                <Table responsive size="sm" className="miCuenta-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordenes.map((orden) => {
                      const productosFiltrados = orden.detalles_orden.filter(d =>
                        d.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
                      );

                      if (productosFiltrados.length === 0) return null;

                      // Calcular total del pedido
                      const totalPedido = productosFiltrados.reduce((acc, d) => {
                        const precio = precios[d.id_producto || d.producto_id] || 0;
                        return acc + precio * d.cantidad;
                      }, 0);

                      return (
                        <>
                          {productosFiltrados.map((d, i) => (
                            <tr key={`${orden.id_orden}-${i}`}>
                              <td>#{orden.id_orden}</td>
                              <td>
                                <span className="miCuenta-fecha">
                                  {new Date(orden.fecha).toLocaleString()}
                                </span>
                              </td>
                              <td>
                                <span className="miCuenta-product-title">{d.nombre_producto}</span>
                                <br />
                                <small className="miCuenta-product-category">{d.formato_nombre}</small>
                              </td>
                              <td className="fw-bold">x{d.cantidad}</td>
                              <td>
                                <Badge
                                  bg={
                                    orden.estado === "Completado" ? "success" :
                                    orden.estado === "Rechazado" ? "danger" :
                                    "warning"
                                  }
                                  text="dark"
                                  className="px-3"
                                >
                                  {orden.estado === "Por Confirmar" ? "Pendiente" : orden.estado}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <Button
                                  size="sm"
                                  className="miCuenta-btn-cancelar me-2"
                                  onClick={() => setDetalleModal(orden)}
                                >
                                  Ver
                                </Button>

                                <Button
                                  className="miCuenta-btn-opinar"
                                  size="sm"
                                  onClick={() => abrirModalReseña(d)}
                                  disabled={orden.estado !== "Completado"}
                                  style={{
                                    opacity: orden.estado !== "Completado" ? 0.4 : 1,
                                    cursor: orden.estado !== "Completado" ? "not-allowed" : "pointer",
                                  }}
                                >
                                  ★ Opinar
                                </Button>
                              </td>
                            </tr>
                          ))}

                          {/* FILA DEL TOTAL DEL PEDIDO */}
                          <tr className="fw-bold">
                            <td colSpan={5} className="text-end">Total Pedido:</td>
                            <td className="text-end">${totalPedido.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="datos" title="Mis Datos de Envío">
          <Card className="miCuenta-card p-4">
            <Form onSubmit={manejarGuardarPerfil}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="miCuenta-label">Nombre Completo</Form.Label>
                    <Form.Control 
                      type="text"
                      className="miCuenta-input"
                      value={perfil.nombre || ''}
                      onChange={e => setPerfil({ ...perfil, nombre: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="miCuenta-label">Teléfono</Form.Label>
                    <Form.Control 
                      type="text"
                      className="miCuenta-input"
                      value={perfil.telefono || ''}
                      onChange={e => setPerfil({ ...perfil, telefono: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="miCuenta-label">Dirección de Envío</Form.Label>
                <Form.Control 
                  type="text"
                  className="miCuenta-input"
                  value={perfil.direccion || ''}
                  onChange={e => setPerfil({ ...perfil, direccion: e.target.value })}
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

      {detalleModal && (
        <Modal show onHide={() => setDetalleModal(null)} centered>
          <div className="miCuenta-card p-3">
            <Modal.Header closeButton className="miCuenta-card-header">
              <Modal.Title className="miCuenta-title">
                Detalle del Pedido #{detalleModal.id_orden}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <p>
                <strong>Fecha:</strong>{" "}
                <span className="miCuenta-fecha">
                  {new Date(detalleModal.fecha).toLocaleString()}
                </span>
              </p>

              <Table size="sm" className="miCuenta-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cant.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {detalleModal.detalles_orden.map((d, i) => (
                    <tr key={i}>
                      <td>{d.nombre_producto}</td>
                      <td>
                        ${(
                          precios[d.id_producto || d.producto_id] || 0
                        ).toLocaleString()}
                      </td>
                      <td>{d.cantidad}</td>
                      <td>
                        ${(
                          (precios[d.id_producto || d.producto_id] || 0) * d.cantidad
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="text-end fw-bold mt-3">
                Total: ${detalleModal.total.toLocaleString()}
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button className="miCuenta-btn-cancelar" onClick={() => setDetalleModal(null)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
      )}

      <Modal show={showResenaModal} onHide={() => setShowResenaModal(false)} centered>
        <div className="miCuenta-card p-2">
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
                      onClick={() => setReseñaData({ ...reseñaData, calificacion: star })}
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
                  className="miCuenta-input"
                  value={reseñaData.comentario}
                  onChange={e => setReseñaData({ ...reseñaData, comentario: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer className="d-flex justify-content-between">
            <Button className="miCuenta-btn-cancelar" onClick={() => setShowResenaModal(false)}>
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
