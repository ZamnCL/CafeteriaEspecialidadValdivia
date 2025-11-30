import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { supabase } from '../../supabase/cliente';

const InfoLocalAdmin = () => {
  const [formData, setFormData] = useState({
    id_info: null, 
    direccion: '', 
    telefono: '', 
    correo: '', 
    horario_atencion: '', 
    mapa_ubicacion: '', 
    instagram: '',
    facebook: ''
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      // Obtenemos la primera fila de la tabla de información
      const { data } = await supabase.from('informacionlocal').select('*').single();
      if (data) setFormData(data);
      setLoading(false);
    };
    fetchInfo();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const guardarCambios = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upsert: Actualiza si existe, crea si no
      const { error } = await supabase.from('informacionlocal').upsert(formData);
      if (error) throw error;
      setMsg({ type: 'success', text: 'Información del local actualizada correctamente.' });
    } catch (error) {
      setMsg({ type: 'danger', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-admin-dark border-0">
      <Card.Body className="p-4">
        <h5 className="text-coffee-accent mb-4">Configuración del Local (Footer y Mapa)</h5>
        
        {msg && <Alert variant={msg.type} onClose={() => setMsg(null)} dismissible>{msg.text}</Alert>}

        <Form onSubmit={guardarCambios}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control name="direccion" value={formData.direccion} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control name="telefono" value={formData.telefono} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control name="correo" value={formData.correo} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Usuario Instagram (sin @)</Form.Label>
                <Form.Control name="instagram" value={formData.instagram} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Horario de Atención</Form.Label>
            <Form.Control name="horario_atencion" value={formData.horario_atencion} onChange={handleChange} placeholder="Ej: Lun-Vie 09:00 - 18:00" />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>URL del Mapa (Embed Link)</Form.Label>
            <Form.Control as="textarea" rows={2} name="mapa_ubicacion" value={formData.mapa_ubicacion} onChange={handleChange} placeholder="http://googleusercontent.com/maps..." />
            <Form.Text className="text-muted">
              Copia aquí el enlace del iframe de Google Maps o usa el enlace por defecto.
            </Form.Text>
          </Form.Group>

          <Button type="submit" className="btn-coffee-pill border-0 w-100" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Información'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default InfoLocalAdmin;