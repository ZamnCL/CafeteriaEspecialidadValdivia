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
    mapa_ubicacion: ''
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const { data } = await supabase.from('informacionlocal').select('*').single();
      if (data) {
        // Filtramos solo los campos que nos interesan para evitar errores con campos extra
        setFormData({
            id_info: data.id_info,
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            correo: data.correo || '',
            horario_atencion: data.horario_atencion || '',
            mapa_ubicacion: data.mapa_ubicacion || ''
        });
      }
      setLoading(false);
    };
    fetchInfo();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const guardarCambios = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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
        <h5 className="text-coffee-title mb-4" style={{ color: 'var(--coffee-accent)' }}>Configuración del Local (Footer y Mapa)</h5>
        
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

          <Form.Group className="mb-3">
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control name="correo" value={formData.correo} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Horario de Atención</Form.Label>
            <Form.Control name="horario_atencion" value={formData.horario_atencion} onChange={handleChange} placeholder="Ej: Lun-Vie 09:00 - 18:00" />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>URL del Mapa (Embed Link)</Form.Label>
            <Form.Control as="textarea" rows={2} name="mapa_ubicacion" value={formData.mapa_ubicacion} onChange={handleChange} placeholder="<iframe src='...'></iframe> o el link https://.../embed..." />
            <Form.Text className="text-muted">
              Pega aquí el código de inserción (Embed) de Google Maps.
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