import { useState, useEffect, Fragment } from 'react';
import { Container, Row, Col, Form, Button, Tab, Tabs, Table, Modal, Alert, Badge, Card, InputGroup } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEye, FaStar, FaCalendarAlt, FaCreditCard, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';

import "./MiCuenta.css";

function MiCuenta() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState({ nombre: '', direccion: '', telefono: '' });
  const [ordenes, setOrdenes] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const [detalleModal, setDetalleModal] = useState(null);
  const [showResenaModal, setShowResenaModal] = useState(false);
  const [reseñaData, setReseñaData] = useState({
    id_producto: null, nombre_producto: '', calificacion: 5, comentario: ''
  });

  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const { data: dataPerfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
      if (dataPerfil) setPerfil(dataPerfil);

      const { data: dataOrdenes } = await supabase
        .from('ordenes')
        .select(`*, detalles_orden(*)`)
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });

      setOrdenes(dataOrdenes || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const manejarGuardarPerfil = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('perfiles').upsert({ id: user.id, ...perfil });
    if (error) setMsg({ type: 'danger', text: 'Error al guardar.' });
    else setMsg({ type: 'success', text: 'Información guardada correctamente.' });
  };

  const abrirModalReseña = (detalle) => {
    setReseñaData({ id_producto: detalle.id_producto, nombre_producto: detalle.nombre_producto, calificacion: 5, comentario: '' });
    setShowResenaModal(true);
  };

  const enviarReseña = async () => {
    const { error } = await supabase.from('resenas').insert([{ user_id: user.id, id_producto: reseñaData.id_producto, calificacion: parseInt(reseñaData.calificacion), comentario: reseñaData.comentario }]);
    if (error) alert("Error: " + error.message);
    else { alert("¡Gracias!"); setShowResenaModal(false); }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    const term = busqueda.toLowerCase();
    return orden.id_orden.toString().includes(term) || 
           orden.detalles_orden.some(d => d.nombre_producto.toLowerCase().includes(term));
  });

  if (loading) return <Container className="mt-5 text-center">Cargando...</Container>;

  return (
    <Container className="my-5 miCuenta-container">
      
      <style>{`
        .miCuenta-table tr.fila-producto td {
          border-bottom: none !important;
          padding-top: 12px !important;
          padding-bottom: 12px !important;
        }
        .miCuenta-table tbody tr.fila-producto:first-child td {
          padding-top: 1.5rem !important;
        }
      `}</style>

      <h2 className="miCuenta-title mb-4">Mi Cuenta</h2>
      {msg.text && <Alert variant={msg.type} dismissible onClose={() => setMsg({})}>{msg.text}</Alert>}

      <Tabs defaultActiveKey="pedidos" className="mb-4 miCuenta-tabs">
        <Tab eventKey="pedidos" title="Mis Pedidos">
          <Card className="miCuenta-card mb-4 border-0 shadow-sm">
            <Card.Body>
              <InputGroup className="mb-4" style={{maxWidth: '400px'}}>
                <InputGroup.Text className="bg-dark border-dark text-white"><FaSearch /></InputGroup.Text>
                <Form.Control type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="miCuenta-input" />
              </InputGroup>

              <Table responsive className="miCuenta-table align-middle" style={{borderCollapse: 'collapse'}}>
                <thead>
                  <tr>
                    <th style={{width: '8%'}}># Pedido</th>
                    <th style={{width: '10%'}}>Fecha</th>
                    <th style={{width: '30%'}}>Producto</th>
                    <th className="text-center" style={{width: '8%'}}>Cant.</th>
                    <th style={{width: '24%'}}>Estado / Total</th>
                    <th className="text-end" style={{width: '20%'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesFiltradas.map((orden) => {
                    const productosVisibles = orden.detalles_orden.filter(d => 
                      busqueda === '' || 
                      orden.id_orden.toString().includes(busqueda) ||
                      d.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
                    );

                    if (productosVisibles.length === 0) return null;

                    return (
                      <Fragment key={orden.id_orden}>
                        {productosVisibles.map((d, i) => (
                          <tr key={`${orden.id_orden}-${i}`} className="fila-producto">
                            <td className={i === 0 ? "fw-bold" : "opacity-0"}>#{orden.id_orden}</td>
                            <td className={i === 0 ? "" : "opacity-0"}>
                                <span className="miCuenta-fecha">
                                    {new Date(orden.fecha).toLocaleDateString()}
                                </span>
                            </td>
                            
                            <td>
                              <span className="miCuenta-product-title">{d.nombre_producto}</span>
                              <br />
                              <small className="text-white-50">{d.formato_nombre}</small>
                            </td>
                            
                            <td className="fw-bold text-center text-white-50">x{d.cantidad}</td>
                            
                            <td>
                              {i === 0 && (
                                <div className="d-flex align-items-center justify-content-between gap-3">
                                  <Badge bg={orden.estado === "Completado" ? "success" : orden.estado === "Rechazado" ? "danger" : "warning"} text="dark" className="px-3 py-2">
                                    {orden.estado === "Por Confirmar" ? "Pendiente" : orden.estado}
                                  </Badge>
                                  
                                  {/* TOTAL DEL PEDIDO A LA DERECHA DEL ESTADO */}
                                  <div className="text-end">
                                    <div className="small text-muted text-uppercase" style={{fontSize: '0.65rem', letterSpacing: '0.5px'}}>Total</div>
                                    <div className="fw-bold" style={{color: '#C9A97E', fontSize: '1.3rem'}}>
                                      ${orden.total.toLocaleString('es-CL')}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="text-end">
                              <div className="d-flex gap-2 justify-content-end align-items-center">
                                {/* BOTÓN VER PRIMERO (izquierda) */}
                                {i === 0 && (
                                  <Button
                                    size="sm"
                                    className="miCuenta-btn-cancelar"
                                    onClick={() => setDetalleModal(orden)}
                                  >
                                    <FaEye className="me-1"/> Ver
                                  </Button>
                                )}
                                
                                {/* BOTÓN OPINAR DESPUÉS (derecha) */}
                                <Button
                                  className="miCuenta-btn-opinar"
                                  size="sm"
                                  onClick={() => abrirModalReseña(d)}
                                  disabled={orden.estado !== "Completado"}
                                  style={{opacity: orden.estado !== "Completado" ? 0.4 : 1, cursor: orden.estado !== "Completado" ? "not-allowed" : "pointer"}}
                                >
                                  <FaStar className="mb-1"/> Opinar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* LÍNEA SEPARADORA BEIGE ENTRE PEDIDOS */}
                        <tr className="fila-separador">
                          <td colSpan={6} style={{
                            borderBottom: '2px solid #C9A97E',
                            paddingTop: '1rem',
                            paddingBottom: '1rem'
                          }}></td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="datos" title="Mis Datos de Envío">
          <Card className="miCuenta-card p-4 border-0">
            <Form onSubmit={manejarGuardarPerfil}>
              <Row><Col md={6}><Form.Group className="mb-3"><Form.Label className="miCuenta-label">Nombre Completo</Form.Label><Form.Control type="text" className="miCuenta-input" value={perfil.nombre || ''} onChange={e => setPerfil({ ...perfil, nombre: e.target.value })} /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label className="miCuenta-label">Teléfono</Form.Label><Form.Control type="text" className="miCuenta-input" value={perfil.telefono || ''} onChange={e => setPerfil({ ...perfil, telefono: e.target.value })} /></Form.Group></Col></Row>
              <Form.Group className="mb-3"><Form.Label className="miCuenta-label">Dirección de Envío</Form.Label><Form.Control type="text" className="miCuenta-input" value={perfil.direccion || ''} onChange={e => setPerfil({ ...perfil, direccion: e.target.value })} placeholder="Calle, Número, Comuna" /></Form.Group>
              <Button className="miCuenta-btn-guardar mt-2" type="submit">Guardar Información</Button>
            </Form>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal Detalle */}
      {detalleModal && (
        <Modal show onHide={() => setDetalleModal(null)} size="lg" centered contentClassName="miCuenta-card border-0">
          <Modal.Header closeButton className="miCuenta-card-header border-secondary">
            <Modal.Title className="miCuenta-title">Pedido #{detalleModal.id_orden}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
             <div className="p-3 mb-4 rounded" style={{backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #333'}}>
              <Row className="g-3 text-white-50">
                <Col md={6}>
                  <div className="mb-2"><FaCalendarAlt className="me-2 text-coffee-accent"/> <strong className="text-white">Fecha:</strong> {new Date(detalleModal.fecha).toLocaleDateString()}</div>
                  <div className="mb-2"><FaCreditCard className="me-2 text-coffee-accent"/> <strong className="text-white">Pago:</strong> {detalleModal.metodo_pago}</div>
                </Col>
                <Col md={6}>
                  <div className="mb-2"><FaTruck className="me-2 text-coffee-accent"/> <strong className="text-white">Entrega:</strong> {detalleModal.tipo_entrega || 'Delivery'}</div>
                  <div className="d-flex align-items-start"><FaMapMarkerAlt className="me-2 mt-1 text-coffee-accent"/> <div><strong className="text-white d-block">Dirección:</strong>{detalleModal.direccion}, {detalleModal.ciudad}</div></div>
                </Col>
              </Row>
            </div>
            <Table responsive size="sm" className="miCuenta-table align-middle mb-0">
              <thead className="text-muted small"><tr><th>Producto</th><th className="text-end">Precio Unit.</th><th className="text-center">Cant.</th><th className="text-end">Subtotal</th></tr></thead>
              <tbody>
                {detalleModal.detalles_orden.map((d, i) => (
                  <tr key={i} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td className="py-3"><div className="fw-bold text-white">{d.nombre_producto}</div><small className="text-white-50">{d.formato_nombre}</small></td>
                    <td className="text-end text-white-50">${d.precio_unitario.toLocaleString('es-CL')}</td>
                    <td className="text-center fw-bold">x{d.cantidad}</td>
                    <td className="text-end text-coffee-accent fw-bold">${(d.subtotal_item || (d.precio_unitario * d.cantidad)).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex justify-content-end mt-4 pt-3 border-top border-secondary align-items-center"><span className="me-3 text-muted text-uppercase fw-bold small">Total Pagado:</span><span className="fs-3 fw-bold text-success">${detalleModal.total.toLocaleString('es-CL')}</span></div>
          </Modal.Body>
          <Modal.Footer className="border-top-0"><Button className="miCuenta-btn-cancelar" onClick={() => setDetalleModal(null)}>Cerrar</Button></Modal.Footer>
        </Modal>
      )}

      {/* Modal Reseña */}
      <Modal show={showResenaModal} onHide={() => setShowResenaModal(false)} centered contentClassName="miCuenta-card border-0">
        <div className="p-3">
          <Modal.Header closeButton className="miCuenta-card-header border-secondary"><Modal.Title className="miCuenta-title fs-5">Opinar sobre <span className="text-coffee-accent">{reseñaData.nombre_producto}</span></Modal.Title></Modal.Header>
          <Modal.Body><Form><Form.Group className="mb-3 text-center"><Form.Label className="miCuenta-label d-block mb-2">Tu Calificación</Form.Label><div className="fs-1 miCuenta-stars">{[1, 2, 3, 4, 5].map((star) => (<span key={star} onClick={() => setReseñaData({ ...reseñaData, calificacion: star })} className="mx-1 transition-all">{star <= reseñaData.calificacion ? '★' : '☆'}</span>))}</div></Form.Group><Form.Group><Form.Label className="miCuenta-label">Tu Comentario</Form.Label><Form.Control as="textarea" rows={3} className="miCuenta-input" value={reseñaData.comentario} onChange={e => setReseñaData({ ...reseñaData, comentario: e.target.value })} /></Form.Group></Form></Modal.Body>
          <Modal.Footer className="d-flex justify-content-between"><Button className="miCuenta-btn-cancelar" onClick={() => setShowResenaModal(false)}>Cancelar</Button><Button className="miCuenta-btn-guardar" onClick={enviarReseña}>Enviar Reseña</Button></Modal.Footer>
        </div>
      </Modal>

    </Container>
  );
}

export default MiCuenta;