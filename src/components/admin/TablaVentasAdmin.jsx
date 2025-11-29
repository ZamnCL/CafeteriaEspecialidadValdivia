import { useState } from 'react';
import { Table, Button, Badge, Nav, Image, Modal, Row, Col } from 'react-bootstrap';
import { supabase } from '../../supabase/cliente';
import emailjs from '@emailjs/browser';
import { 
  FaCheck, FaTimes, FaEye, FaClock, FaCheckCircle, FaBan, FaHistory, FaListUl,
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTruck, FaStore
} from 'react-icons/fa';

function TablaVentasAdmin({ ventas, alRefrescar }) {
  const [filtroVentas, setFiltroVentas] = useState('pendientes');
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [imgComprobante, setImgComprobante] = useState('');
  
  // Estado del Modal de Orden
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [mostrarModalOrden, setMostrarModalOrden] = useState(false);

  // --- EMAILJS ---
  const enviarCorreoEstado = (venta, nuevoEstado) => {
    const esAprobado = nuevoEstado === 'Completado';
    
    // TUS CREDENCIALES
    const serviceID = 'service_94ynerp'; 
    const templateID = 'template_vz8y98i'; 
    const publicKey = 'BBJajnSVNxciJjOo3'; 

    const enlaceAccion = esAprobado 
      ? `${window.location.origin}/mi-cuenta` 
      : `${window.location.origin}/rectificar-pago/${venta.id_orden}`;

    const emailDestino = venta.email_contact || venta.email;
    if (!emailDestino) return;

    const params = {
      to_email: emailDestino,
      to_name: venta.nombre || "Cliente",
      order_id: venta.id_orden,
      status_title: esAprobado ? '¡Pago Aprobado! 🎉' : 'Problema con tu Comprobante ⚠️',
      message: esAprobado 
        ? 'Hemos validado tu transferencia exitosamente. Estamos preparando tu pedido.' 
        : 'No pudimos validar la transferencia. Por favor sube una nueva foto.',
      action_text: esAprobado ? 'Ver Mi Pedido' : 'Subir Nuevo Comprobante',
      action_link: enlaceAccion
    };

    emailjs.send(serviceID, templateID, params, publicKey)
      .catch((err) => console.error('❌ Error enviando correo:', err));
  };

  const cambiarEstadoOrden = async (idOrden, nuevoEstado) => {
    const accion = nuevoEstado === 'Completado' ? 'Aprobar' : 'Rechazar';
    if (!confirm(`¿Estás seguro de ${accion} esta venta?`)) return;
    
    try {
      const ventaActual = ventas.find(v => v.id_orden === idOrden);
      const { error } = await supabase.from('ordenes').update({ estado: nuevoEstado }).eq('id_orden', idOrden);
      if (error) throw error;
      
      if (ventaActual) enviarCorreoEstado(ventaActual, nuevoEstado);
      
      alert(`Orden #${idOrden} actualizada.`);
      alRefrescar();
    } catch (err) {
      alert(err.message);
    }
  };

  const verComprobante = (url) => {
    setImgComprobante(url);
    setMostrarComprobante(true);
  };

  const verDetallesOrden = (orden) => {
    setOrdenSeleccionada(orden);
    setMostrarModalOrden(true);
  };

  const cerrarModalOrden = () => {
    setOrdenSeleccionada(null);
    setMostrarModalOrden(false);
  };

  const ventasFiltradas = ventas.filter(v => {
    if (filtroVentas === 'todos') return true;
    if (filtroVentas === 'pendientes') return v.estado === 'Por Confirmar';
    if (filtroVentas === 'aprobados') return v.estado === 'Completado';
    if (filtroVentas === 'rechazados') return v.estado === 'Rechazado';
    return true;
  });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Solicitudes de Compra</h5>
      </div>

      <Nav variant="pills" className="mb-4 nav-pills-coffee">
        <Nav.Item><Nav.Link eventKey="pendientes" onClick={() => setFiltroVentas('pendientes')} active={filtroVentas === 'pendientes'} className="d-flex align-items-center gap-2"><FaClock /> Pendientes <Badge bg="danger" pill>{ventas.filter(v => v.estado === 'Por Confirmar').length}</Badge></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="aprobados" onClick={() => setFiltroVentas('aprobados')} active={filtroVentas === 'aprobados'} className="d-flex align-items-center gap-2"><FaCheckCircle /> Aprobados</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="rechazados" onClick={() => setFiltroVentas('rechazados')} active={filtroVentas === 'rechazados'} className="d-flex align-items-center gap-2"><FaBan /> Rechazados</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="todos" onClick={() => setFiltroVentas('todos')} active={filtroVentas === 'todos'} className="d-flex align-items-center gap-2"><FaHistory /> Todos</Nav.Link></Nav.Item>
      </Nav>

      <Table hover responsive className="align-middle table-dark-custom">
        <thead>
          <tr>
            <th style={{paddingLeft:'1.5rem'}}>ID / Fecha</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Comprobante</th>
            <th>Detalles</th>
            <th>Estado</th>
            <th className="text-end" style={{paddingRight:'1.5rem'}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventasFiltradas.map(v => (
            <tr key={v.id_orden}>
              <td style={{paddingLeft: '1.5rem'}}>
                <div className="fw-bold">#{v.id_orden}</div>
                <small className="text-white-50">{new Date(v.fecha).toLocaleDateString()}</small>
              </td>
              <td>
                <div className="fw-bold text-white">{v.nombre} {v.apellido}</div>
                <div className="small text-white-50">{v.email}</div>
              </td>
              <td className="fw-bold text-success">${v.total.toLocaleString()}</td>
              <td>
                {v.comprobante ? (
                  <Button size="sm" variant="outline-info" onClick={() => verComprobante(v.comprobante)} className="rounded-pill">
                    <FaEye className="me-1"/> Ver Foto
                  </Button>
                ) : <span className="text-muted small">No adjunto</span>}
              </td>
              <td>
                <Button size="sm" variant="outline-light" onClick={() => verDetallesOrden(v)} className="rounded-pill border-secondary text-coffee-accent" title="Ver detalles completos">
                  <FaListUl /> Ver Orden
                </Button>
              </td>
              <td>
                <Badge bg={v.estado === 'Completado' ? 'success' : v.estado === 'Rechazado' ? 'danger' : 'warning'} text="dark" className="px-3 py-2">
                  {v.estado === 'Por Confirmar' ? 'Pendiente' : v.estado}
                </Badge>
              </td>
              <td className="text-end" style={{paddingRight: '1.5rem'}}>
                {v.estado === 'Por Confirmar' && (
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="success" size="sm" onClick={() => cambiarEstadoOrden(v.id_orden, 'Completado')} title="Aprobar"><FaCheck /></Button>
                    <Button variant="danger" size="sm" onClick={() => cambiarEstadoOrden(v.id_orden, 'Rechazado')} title="Rechazar"><FaTimes /></Button>
                  </div>
                )}
                {v.estado === 'Completado' && <span className="text-success small fw-bold"><FaCheck /> Aprobado</span>}
                {v.estado === 'Rechazado' && <span className="text-danger small fw-bold"><FaTimes /> Rechazado</span>}
              </td>
            </tr>
          ))}
          {ventasFiltradas.length === 0 && <tr><td colSpan="7" className="text-center py-5 text-muted">No hay solicitudes en esta sección</td></tr>}
        </tbody>
      </Table>

      {/* Modal Comprobante */}
      <Modal show={mostrarComprobante} onHide={() => setMostrarComprobante(false)} size="lg" centered contentClassName="bg-dark text-white border-0">
        <Modal.Header closeButton closeVariant="white" className="border-secondary"><Modal.Title>Comprobante de Pago</Modal.Title></Modal.Header>
        <Modal.Body className="text-center p-0 bg-secondary"><Image src={imgComprobante} fluid style={{maxHeight: '80vh'}} /></Modal.Body>
        <Modal.Footer className="border-secondary"><Button variant="secondary" onClick={() => setMostrarComprobante(false)}>Cerrar</Button></Modal.Footer>
      </Modal>

      {/* Modal Detalles Orden */}
      <Modal show={mostrarModalOrden} onHide={cerrarModalOrden} size="lg" centered contentClassName="bg-white text-dark border-0 shadow-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
          <Modal.Title className="fw-bold text-uppercase" style={{ color: 'var(--coffee-dark)', letterSpacing: '1px', fontSize: '1.2rem' }}>
            Orden #{ordenSeleccionada?.id_orden}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pt-2 pb-4">
          {ordenSeleccionada && (
            <div>
              {/* Datos del Cliente */}
              <div className="mb-4 p-3 rounded bg-light border-start border-4" style={{borderColor: 'var(--coffee-accent)'}}>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <FaUser className="me-2 text-secondary" size={14} />
                      <span className="fw-bold text-dark">{ordenSeleccionada.nombre} {ordenSeleccionada.apellido}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaEnvelope className="me-2 text-secondary" size={14} />
                      <span className="text-muted small">{ordenSeleccionada.email}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                     <div className="d-flex align-items-start mb-2">
                      <FaMapMarkerAlt className="me-2 text-secondary mt-1" size={14} />
                      <span className="text-dark small fw-medium lh-sm">
                        {ordenSeleccionada.direccion}, {ordenSeleccionada.ciudad}<br/>
                        {ordenSeleccionada.region}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      {ordenSeleccionada.tipo_entrega === 'delivery' ? <FaTruck className="me-2 text-secondary" size={14}/> : <FaStore className="me-2 text-secondary" size={14}/>}
                      <span className="text-uppercase small fw-bold text-secondary" style={{letterSpacing:'0.5px'}}>
                        {ordenSeleccionada.tipo_entrega || 'Delivery'}
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Tabla de Productos */}
              <div className="table-responsive">
                <Table className="align-middle mb-0" style={{borderCollapse: 'separate', borderSpacing: '0 10px'}}>
                  <thead>
                    <tr className="text-secondary text-uppercase small" style={{borderBottom: '2px solid #eee'}}>
                      <th className="fw-bold border-0 pb-2 ps-2">Producto</th>
                      <th className="fw-bold border-0 pb-2 text-center">Cant.</th>
                      <th className="fw-bold border-0 pb-2 text-end pe-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenSeleccionada.detalles_orden?.map((d, idx) => (
                      <tr key={idx}>
                        <td className="border-0 py-2 ps-2">
                          <div className="fw-bold text-dark" style={{fontSize: '1rem'}}>{d.nombre_producto}</div>
                          <div className="text-muted small">{d.formato_nombre}</div>
                        </td>
                        <td className="border-0 py-2 text-center text-dark fw-medium">x{d.cantidad}</td>
                        <td className="border-0 py-2 text-end pe-2 fw-bold text-dark">
                          ${d.subtotal_item.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Total */}
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                 <div className="text-muted small">
                   Fecha: {new Date(ordenSeleccionada.fecha).toLocaleDateString()}
                 </div>
                 <div className="text-end">
                    <div className="display-6 fw-bold" style={{color: 'var(--coffee-dark)', fontSize: '1.8rem'}}>
                      ${ordenSeleccionada.total.toLocaleString()}
                    </div>
                 </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 text-end pb-4 px-4">
          <Button variant="outline-secondary" className="px-4 py-2 rounded-pill fw-medium" onClick={cerrarModalOrden} style={{borderWidth: '2px'}}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TablaVentasAdmin;