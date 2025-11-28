import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/cliente';
import { FaGoogle } from 'react-icons/fa'; // Asegúrate de tener react-icons instalado
import { useAuth } from '../context/AuthContext';

// Reutilizamos estilos del Admin para coherencia, o puedes poner estilos inline
import './Admin.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si ya está logueado, redirigir
  useEffect(() => {
    if (user) navigate('/admin'); // O a /mi-cuenta
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/'); // Redirigir al inicio tras login exitoso
    }
  };

  // MANEJADOR GOOGLE
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin // Vuelve a tu página actual después de Google
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px', borderRadius: '20px', border: 'none' }} className="shadow-lg">
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold" style={{color: '#5c3d2e'}}>Bienvenido</h3>
            <p className="text-muted small">Ingresa a tu cuenta</p>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}

          {/* BOTÓN GOOGLE (Destacado) */}
          <Button 
            variant="outline-dark" 
            className="w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 mb-4"
            onClick={handleGoogleLogin}
            style={{padding: '12px', borderColor: '#ddd'}}
            disabled={loading}
          >
            <FaGoogle className="text-danger" /> 
            <span className="fw-bold">Continuar con Google</span>
          </Button>

          <div className="d-flex align-items-center mb-4">
            <hr className="flex-grow-1" /> <span className="mx-2 text-muted small">o con email</span> <hr className="flex-grow-1" />
          </div>
          
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Email</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="rounded-pill bg-light border-0 px-3"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small text-muted">Contraseña</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="rounded-pill bg-light border-0 px-3"
              />
            </Form.Group>
            
            <Button type="submit" className="w-100 rounded-pill mb-3 btn-coffee-pill border-0" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Ingresar'}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <small>¿No tienes cuenta? <Link to="/registro" style={{color: '#c4a484', fontWeight: 'bold'}}>Regístrate aquí</Link></small>
          </div>

        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;