import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import emailjs from '@emailjs/browser';
import { FaBuilding, FaUser } from 'react-icons/fa';

function Contacto() {
  const [tipo, setTipo] = useState('general'); // 'general' o 'mayorista'
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    mensaje: '',
    // Campos exclusivos mayorista
    empresa: '',
    rut_empresa: '',
    volumen: ''
  });

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  // --- 1. ENVIAR NOTIFICACIÓN POR CORREO (EmailJS) ---
  const enviarCorreoNotificacion = (datos) => {
    const serviceID = 'YOUR_SERVICE_ID'; // <--- REEMPLAZA CON TU ID
    const templateID = 'YOUR_TEMPLATE_ID'; // <--- REEMPLAZA CON TU ID DE CONTACTO
    const publicKey = 'YOUR_PUBLIC_KEY'; // <--- REEMPLAZA CON TU PUBLIC KEY

    const params = {
      from_name: datos.nombre,
      from_email: datos.email,
      tipo_mensaje: tipo === 'mayorista' ? 'SOLICITUD MAYORISTA' : 'Contacto General',
      message: datos.mensaje,
      detalles_empresa: tipo === 'mayorista' 
        ? `Empresa: ${datos.empresa}, RUT: ${datos.rut_empresa}, Vol: ${datos.volumen}` 
        : 'N/A'
    };

    emailjs.send(serviceID, templateID, params, publicKey)
      .catch((err) => console.error('Error EmailJS:', err));
  };

  // --- 2. GUARDAR EN SUPABASE Y PROCESAR ---
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({});

    try {
      // A) Insertar en Base de Datos
      const { error } = await supabase.from('mensajescontacto').insert([{
        nombre_remitente: formulario.nombre,
        correo_remitente: formulario.email,
        mensaje: formulario.mensaje,
        tipo: tipo,
        // Si es mayorista guardamos los datos, si no, null
        nombre_empresa: tipo === 'mayorista' ? formulario.empresa : null,
        rut_empresa: tipo === 'mayorista' ? formulario.rut_empresa : null,
        volumen_estimado: tipo === 'mayorista' ? formulario.volumen : null,
        fecha_envio: new Date()
      }]);

      if (error) throw error;

      // B) Enviar Notificación
      enviarCorreoNotificacion(formulario);

      setMensaje({ type: 'success', texto: '¡Mensaje enviado! Nos pondremos en contacto contigo.' });
      setFormulario({ nombre: '', email: '', mensaje: '', empresa: '', rut_empresa: '', volumen: '' });

    } catch (error) {
      console.error(error);
      setMensaje({ type: 'danger', texto: 'Error al enviar: ' + error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4 fw-bold text-coffee-title">Contáctanos</h2>
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0" style={{ borderRadius: '15px' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4">
              {/* Pestañas estilo "Pills" del diseño */}
              <Nav variant="pills" className="nav-pills-coffee justify-content-center w-100 gap-2">
                <Nav.Item>
                  <Nav.Link 
                    active={tipo === 'general'} 
                    onClick={() => setTipo('general')} 
                    className="px-4"
                    style={{cursor: 'pointer'}}
                  >
                    <FaUser className="me-2"/> General
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={tipo === 'mayorista'} 
                    onClick={() => setTipo('mayorista')} 
                    className="px-4"
                    style={{cursor: 'pointer'}}
                  >
                    <FaBuilding className="me-2"/> Mayorista
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body className="p-4 pt-2">
              {mensaje.texto && <Alert variant={mensaje.tipo} dismissible onClose={()=>setMensaje({})}>{mensaje.texto}</Alert>}
              
              <Form onSubmit={manejarEnvio}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Nombre Completo</Form.Label>
                  <Form.Control name="nombre" value={formulario.nombre} onChange={manejarCambio} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">Correo Electrónico</Form.Label>
                  <Form.Control type="email" name="email" value={formulario.email} onChange={manejarCambio} required />
                </Form.Group>

                {/* SECCIÓN MAYORISTA (Condicional) */}
                {tipo === 'mayorista' && (
                  <div className="p-3 bg-light rounded mb-3 border animate-fade-in">
                    <h6 className="text-coffee-dark fw-bold mb-3 small text-uppercase">Datos de Empresa</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small">Razón Social / Nombre</Form.Label>
                          <Form.Control size="sm" name="empresa" value={formulario.empresa} onChange={manejarCambio} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small">RUT Empresa</Form.Label>
                          <Form.Control size="sm" name="rut_empresa" value={formulario.rut_empresa} onChange={manejarCambio} required />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-2">
                      <Form.Label className="small">Volumen Estimado (Kg/Mes)</Form.Label>
                      <Form.Select size="sm" name="volumen" value={formulario.volumen} onChange={manejarCambio} required>
                        <option value="">Selecciona...</option>
                        <option value="5-10kg">5 - 10 kg</option>
                        <option value="10-30kg">10 - 30 kg</option>
                        <option value="+30kg">+30 kg</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                )}

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">Mensaje</Form.Label>
                  <Form.Control as="textarea" rows={4} name="mensaje" value={formulario.mensaje} onChange={manejarCambio} required />
                </Form.Group>

                <Button type="submit" className="w-100 btn-coffee-pill border-0 py-2" disabled={cargando}>
                  {cargando ? <Spinner animation="border" size="sm"/> : (tipo === 'mayorista' ? 'Solicitar Cotización' : 'Enviar Mensaje')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Contacto;