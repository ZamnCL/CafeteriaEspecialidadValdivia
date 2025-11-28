import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import emailjs from '@emailjs/browser';
import { FaEnvelope, FaBuilding, FaUser } from 'react-icons/fa';

function Contacto() {
  const [tipo, setTipo] = useState('general'); // 'general' o 'mayorista'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
    // Campos extra para mayorista
    empresa: '',
    rut_empresa: '',
    volumen: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const enviarCorreoNotificacion = (datos) => {
    const serviceID = 'service_94ynerp';
    const templateID = 'template_feryfg1';
    const publicKey = 'BBJajnSVNxciJjOo3';

    const params = {
      from_name: datos.nombre,
      from_email: datos.email,
      tipo_mensaje: tipo === 'mayorista' ? 'SOLICITUD MAYORISTA' : 'Contacto General',
      mensaje: datos.mensaje,
      detalles_empresa: tipo === 'mayorista' ? `Empresa: ${datos.empresa}, RUT: ${datos.rut_empresa}, Vol: ${datos.volumen}` : 'N/A'
    };

    emailjs.send(serviceID, templateID, params, publicKey);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({});

    try {
      // 1. Guardar en Base de Datos (Tabla 'mensajescontacto')
      const { error } = await supabase.from('mensajescontacto').insert([{
        nombre_remitente: formData.nombre,
        correo_remitente: formData.email,
        mensaje: formData.mensaje,
        tipo: tipo,
        nombre_empresa: tipo === 'mayorista' ? formData.empresa : null,
        rut_empresa: tipo === 'mayorista' ? formData.rut_empresa : null,
        volumen_estimado: tipo === 'mayorista' ? formData.volumen : null
      }]);

      if (error) throw error;

      // 2. Enviar Notificación Automática
      enviarCorreoNotificacion(formData);

      setMsg({ type: 'success', text: 'Mensaje enviado correctamente. Te contactaremos pronto.' });
      setFormData({ nombre: '', email: '', mensaje: '', empresa: '', rut_empresa: '', volumen: '' });

    } catch (error) {
      console.error(error);
      setMsg({ type: 'danger', text: 'Error al enviar: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4 fw-bold text-coffee-title">Contáctanos</h2>
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0" style={{ borderRadius: '15px' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <Nav variant="pills" className="nav-pills-coffee justify-content-center w-100">
                <Nav.Item>
                  <Nav.Link active={tipo === 'general'} onClick={() => setTipo('general')} className="px-4">
                    <FaUser className="me-2"/> General
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link active={tipo === 'mayorista'} onClick={() => setTipo('mayorista')} className="px-4">
                    <FaBuilding className="me-2"/> Mayorista / Empresas
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body className="p-4 pt-2">
              {msg.text && <Alert variant={msg.type}>{msg.text}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo</Form.Label>
                  <Form.Control name="nombre" value={formData.nombre} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                </Form.Group>

                {/* CAMPOS EXCLUSIVOS MAYORISTA */}
                {tipo === 'mayorista' && (
                  <div className="p-3 bg-light rounded mb-3 border animate-fade-in">
                    <h6 className="text-coffee-dark fw-bold mb-3">Datos de Empresa</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Nombre Empresa</Form.Label>
                          <Form.Control name="empresa" value={formData.empresa} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>RUT Empresa</Form.Label>
                          <Form.Control name="rut_empresa" value={formData.rut_empresa} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-2">
                      <Form.Label>Volumen Estimado (Kg/Mes)</Form.Label>
                      <Form.Select name="volumen" value={formData.volumen} onChange={handleChange}>
                        <option value="">Selecciona...</option>
                        <option value="5-10kg">5 - 10 kg</option>
                        <option value="10-30kg">10 - 30 kg</option>
                        <option value="+30kg">+30 kg</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                )}

                <Form.Group className="mb-4">
                  <Form.Label>Mensaje</Form.Label>
                  <Form.Control as="textarea" rows={4} name="mensaje" value={formData.mensaje} onChange={handleChange} required />
                </Form.Group>

                <Button type="submit" className="w-100 btn-coffee-pill border-0 py-2" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm"/> : (tipo === 'mayorista' ? 'Solicitar Cotización' : 'Enviar Mensaje')}
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