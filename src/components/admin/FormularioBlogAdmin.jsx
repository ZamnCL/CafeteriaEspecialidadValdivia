import { useState, useEffect } from 'react';
import { Form, Button, Image } from 'react-bootstrap';
import { supabase } from '../../supabase/cliente';

function FormularioBlogAdmin({ blogAEditar, alCancelar, alExito }) {
  // ... (todo el código anterior de estados y useEffect sigue igual) ...
  const [subiendo, setSubiendo] = useState(false);
  
  const estadoInicial = {
    id: null,
    titulo: '',
    contenido: '',
    imagen: ''
  };
  
  const [datos, setDatos] = useState(estadoInicial);

  useEffect(() => {
    if (blogAEditar) {
      setDatos(blogAEditar);
    } else {
      setDatos(estadoInicial);
    }
  }, [blogAEditar]);

  const manejarCambio = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  // ... (la función manejarImagen sigue igual) ...
  const manejarImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    
    try {
      setSubiendo(true);
      const nombreArchivo = `blog_${Date.now()}.${archivo.name.split('.').pop()}`;
      
      // RECUERDA: Debes tener un bucket público llamado 'blog-images' en Supabase
      const { error } = await supabase.storage.from('blog-images').upload(nombreArchivo, archivo);
      if (error) throw error;
      
      const { data } = supabase.storage.from('blog-images').getPublicUrl(nombreArchivo);
      setDatos(prev => ({ ...prev, imagen: data.publicUrl }));
      
    } catch (error) {
      alert("Error subiendo imagen: " + error.message);
    } finally {
      setSubiendo(false);
    }
  };


  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!datos.titulo || !datos.contenido) return alert("Título y contenido son obligatorios");

    try {
      if (datos.id) {
        // Editar
        const { error } = await supabase.from('blog').update({
          titulo: datos.titulo,
          contenido: datos.contenido,
          imagen: datos.imagen,
          updated_at: new Date()
        }).eq('id', datos.id);
        if (error) throw error;
      } else {
        // Crear
        const { error } = await supabase.from('blog').insert([{
          titulo: datos.titulo,
          contenido: datos.contenido,
          imagen: datos.imagen
        }]);
        if (error) throw error;
      }
      // --- CAMBIO AQUÍ: Mensajes específicos ---
      alExito(datos.id ? 'Blog Actualizado' : 'Blog Creado');
      
    } catch (error) {
      alert("Error guardando: " + error.message);
    }
  };

  // ... (el return con el formulario sigue igual) ...
  return (
    <Form onSubmit={manejarEnvio}>
      <h5 className="text-coffee-title text-coffee-accent mb-4">{datos.id ? 'Editar' : 'Nueva'} Historia</h5>
      
      <Form.Group className="mb-3">
        <Form.Label className="text-white-50">Título</Form.Label>
        <Form.Control 
          name="titulo" 
          value={datos.titulo} 
          onChange={manejarCambio} 
          required 
          className="bg-transparent text-white border-secondary"
          placeholder="Ej: El secreto de nuestro tueste"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="text-white-50">Imagen Principal</Form.Label>
        <Form.Control type="file" onChange={manejarImagen} disabled={subiendo} className="mb-2 bg-dark text-white border-secondary" />
        {datos.imagen && (
          <div className="mt-2">
            <Image src={datos.imagen} alt="Preview" thumbnail style={{maxHeight: '150px', backgroundColor: '#2c2c2c', border: '1px solid #c4a484'}} />
          </div>
        )}
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="text-white-50">Contenido</Form.Label>
        <Form.Control 
          as="textarea" 
          rows={6} 
          name="contenido" 
          value={datos.contenido} 
          onChange={manejarCambio} 
          required 
          className="bg-transparent text-white border-secondary"
          placeholder="Escribe aquí la historia..."
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-light" onClick={alCancelar} className="rounded-pill px-4">Cancelar</Button>
        <Button type="submit" className="btn-coffee-pill border-0" disabled={subiendo}>
          {subiendo ? 'Subiendo...' : (datos.id ? 'Guardar Cambios' : 'Publicar Historia')}
        </Button>
      </div>
    </Form>
  );
}

export default FormularioBlogAdmin;