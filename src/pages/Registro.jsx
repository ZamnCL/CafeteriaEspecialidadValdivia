import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/cliente';
import './Admin.css'; // Reutilizamos estilos

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // 1. Validaciones básicas
    if (formData.password !== formData.confirmPassword) {
      return setMsg({ type: 'danger', text: 'Las contraseñas no coinciden.' });
    }
    if (formData.password.length < 6) {
      return setMsg({ type: 'danger', text: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    setLoading(true);

    try {
      // 2. Registro en Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Enviamos nombre y apellido como metadatos para que el Trigger los capture
          data: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            full_name: `${formData.nombre} ${formData.apellido}` // Compatible con Google
          }
        }
      });

      if (error) throw error;

      // 3. Éxito
      setMsg({ type: 'success', text: 'Cuenta creada con éxito. ¡Bienvenido!' });
      
      // Pequeña pausa para que el usuario lea el mensaje antes de redirigir
      setTimeout(() => {
        navigate('/'); // Opcional: redirigir a Login o Home
      }, 2000);

    } catch (error) {
      setMsg({ type: 'danger', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center my-5" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '500px', borderRadius: '20px', border: 'none' }} className="shadow-lg">
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{color: '#5c3d2e'}}>Crear Cuenta</h3>
            <p className="text-muted small">Únete a Café Valdivia</p>
          </div>

          {msg.text && <Alert variant={msg.type}>{msg.text}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Nombre</Form.Label>
                  <Form.Control 
                    type="text" name="nombre" 
                    value={formData.nombre} onChange={handleChange} required 
                    className="rounded-pill bg-light border-0 px-3"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">Apellido</Form.Label>
                  <Form.Control 
                    type="text" name="apellido" 
                    value={formData.apellido} onChange={handleChange} required 
                    className="rounded-pill bg-light border-0 px-3"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Email</Form.Label>
              <Form.Control 
                type="email" name="email" 
                value={formData.email} onChange={handleChange} required 
                className="rounded-pill bg-light border-0 px-3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Contraseña</Form.Label>
              <Form.Control 
                type="password" name="password" 
                value={formData.password} onChange={handleChange} required 
                className="rounded-pill bg-light border-0 px-3"
                placeholder="Mínimo 6 caracteres"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small text-muted">Confirmar Contraseña</Form.Label>
              <Form.Control 
                type="password" name="confirmPassword" 
                value={formData.confirmPassword} onChange={handleChange} required 
                className="rounded-pill bg-light border-0 px-3"
              />
            </Form.Group>

            <Button type="submit" className="w-100 rounded-pill mb-3 btn-coffee-pill border-0" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Registrarse'}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <small>¿Ya tienes cuenta? <Link to="/login" style={{color: '#c4a484', fontWeight: 'bold'}}>Ingresa aquí</Link></small>
          </div>

        </Card.Body>
      </Card>
    </Container>
  );
}

export default Registro;