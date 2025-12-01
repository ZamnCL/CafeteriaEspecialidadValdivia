import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { supabase } from '../../supabase/cliente';
import { FaInfinity } from 'react-icons/fa';

function FormularioProductoAdmin({ productoAEditar, categorias, alCancelar, alExito }) {
  const [subiendo, setSubiendo] = useState(false);
  const [esGrupoPreparacionSeleccionado, setEsGrupoPreparacionSeleccionado] = useState(false);
  
  const estadoInicialFormulario = {
    id_producto: null, nombre: '', descripcion: '', imagen: '', id_categoria: '', estado: 'Publicado',
    pais: '', notas: '', altura: '', variedad: '', proceso: '',
    unico_precio: '', unico_stock: 10
  };
  
  const [datosFormulario, setDatosFormulario] = useState(estadoInicialFormulario);
  
  const [formatosEstandar, setFormatosEstandar] = useState({
    g250: { activo: true, precio: '', stock: 10 },
    g500: { activo: true, precio: '', stock: 5 },
    g1kg: { activo: true, precio: '', stock: 2 }
  });
  
  const [formatoPersonalizado, setFormatoPersonalizado] = useState({ activo: false, nombre: '', precio: '', stock: 0 });

  const obtenerNombreCategoria = (id) => categorias.find(c => c.id_categoria == id)?.nombre.toLowerCase() || '';
  
  const esCafeEnGrano = (id) => { 
    const nombre = obtenerNombreCategoria(id);
    return nombre.includes('grano') || nombre.includes('tostado') || nombre.includes('origen'); 
  };
  
  const esPreparacionFn = (id_u_obj) => { 
    let nombre = typeof id_u_obj === 'object' ? id_u_obj.nombre.toLowerCase() : obtenerNombreCategoria(id_u_obj);
    return nombre.includes('preparación') || nombre.includes('filtrado') || nombre.includes('bebida') || nombre.includes('barra');
  };

  const esCafe = esCafeEnGrano(datosFormulario.id_categoria);
  const esPrep = esPreparacionFn(datosFormulario.id_categoria);

  const categoriasPreparaciones = categorias.filter(c => esPreparacionFn(c));
  const categoriasGenerales = categorias.filter(c => !esPreparacionFn(c));

  useEffect(() => {
    if (productoAEditar) {
      const esPrepActual = esPreparacionFn(productoAEditar.id_categoria);
      setEsGrupoPreparacionSeleccionado(esPrepActual);
      
      setDatosFormulario({
        ...productoAEditar,
        unico_precio: productoAEditar.formatos?.[0]?.precio || '', 
        unico_stock: productoAEditar.formatos?.[0]?.stock || 0 
      });

      if (esCafeEnGrano(productoAEditar.id_categoria) && productoAEditar.formatos) {
          const nuevosFormatos = { 
              g250: { activo: false, precio: '', stock: 0 },
              g500: { activo: false, precio: '', stock: 0 },
              g1kg: { activo: false, precio: '', stock: 0 }
          };
          let nuevoPersonalizado = { activo: false, nombre: '', precio: '', stock: 0 };

          productoAEditar.formatos.forEach(f => {
              if (f.nombre === '250g') {
                  nuevosFormatos.g250 = { activo: true, precio: f.precio, stock: f.stock };
              } else if (f.nombre === '500g') {
                  nuevosFormatos.g500 = { activo: true, precio: f.precio, stock: f.stock };
              } else if (f.nombre === '1kg') {
                  nuevosFormatos.g1kg = { activo: true, precio: f.precio, stock: f.stock };
              } else {
                  nuevoPersonalizado = { activo: true, nombre: f.nombre, precio: f.precio, stock: f.stock };
              }
          });
          setFormatosEstandar(nuevosFormatos);
          setFormatoPersonalizado(nuevoPersonalizado);
      }
    } else {
      setDatosFormulario(estadoInicialFormulario);
      setFormatosEstandar({ g250: { activo: true, precio: '', stock: 10 }, g500: { activo: true, precio: '', stock: 5 }, g1kg: { activo: true, precio: '', stock: 2 } });
      setFormatoPersonalizado({ activo: false, nombre: '', precio: '', stock: 0 });
    }
  }, [productoAEditar]);

  const manejarCambioInput = (e) => setDatosFormulario({ ...datosFormulario, [e.target.name]: e.target.value });
  
  const manejarCambioSelectorCategoria = (e) => {
    const valor = e.target.value;
    if (valor === 'grupo_preparacion') {
      setEsGrupoPreparacionSeleccionado(true);
      setDatosFormulario({ ...datosFormulario, id_categoria: '' });
    } else {
      setEsGrupoPreparacionSeleccionado(false);
      setDatosFormulario({ ...datosFormulario, id_categoria: valor });
    }
  };

  const manejarClickSubCategoria = (id) => {
    setDatosFormulario({ ...datosFormulario, id_categoria: id });
  };

  const manejarCambioEstandar = (clave, campo, valor) => setFormatosEstandar(prev => ({ ...prev, [clave]: { ...prev[clave], [campo]: valor } }));

  const manejarSubidaImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      setSubiendo(true);
      const nombreArchivo = `${Date.now()}.${archivo.name.split('.').pop()}`;
      const { error: errorSubida } = await supabase.storage.from('imagenes-productos').upload(nombreArchivo, archivo);
      if (errorSubida) throw errorSubida;
      const { data } = supabase.storage.from('imagenes-productos').getPublicUrl(nombreArchivo);
      setDatosFormulario(prev => ({ ...prev, imagen: data.publicUrl }));
    } catch (error) {
      alert("Error subida: " + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!datosFormulario.id_categoria) return alert("Debes seleccionar una Categoría específica.");
    
    const esCafeLocal = esCafeEnGrano(datosFormulario.id_categoria);
    const esPrepLocal = esPreparacionFn(datosFormulario.id_categoria);

    // Validaciones
    if (esCafeLocal) {
        if (formatosEstandar.g250.activo && parseFloat(formatosEstandar.g250.precio) <= 0) return alert("El precio de 250g debe ser mayor a 0.");
        if (formatosEstandar.g500.activo && parseFloat(formatosEstandar.g500.precio) <= 0) return alert("El precio de 500g debe ser mayor a 0.");
        if (formatosEstandar.g1kg.activo && parseFloat(formatosEstandar.g1kg.precio) <= 0) return alert("El precio de 1kg debe ser mayor a 0.");
        if (formatoPersonalizado.activo && parseFloat(formatoPersonalizado.precio) <= 0) return alert("El precio personalizado debe ser mayor a 0.");
        
        if (formatosEstandar.g250.activo && parseInt(formatosEstandar.g250.stock) < 0) return alert("El stock de 250g no puede ser negativo.");
        if (formatosEstandar.g500.activo && parseInt(formatosEstandar.g500.stock) < 0) return alert("El stock de 500g no puede ser negativo.");
        if (formatosEstandar.g1kg.activo && parseInt(formatosEstandar.g1kg.stock) < 0) return alert("El stock de 1kg no puede ser negativo.");
        if (formatoPersonalizado.activo && parseInt(formatoPersonalizado.stock) < 0) return alert("El stock personalizado no puede ser negativo.");
    } else if (!esPrepLocal) {
        if (parseFloat(datosFormulario.unico_precio) <= 0) return alert("El precio debe ser mayor a 0.");
        if (parseInt(datosFormulario.unico_stock) < 0) return alert("El stock no puede ser negativo.");
    }

    try {
      const datosProducto = {
        nombre: datosFormulario.nombre, descripcion: datosFormulario.descripcion, imagen: datosFormulario.imagen,
        id_categoria: parseInt(datosFormulario.id_categoria), estado: datosFormulario.estado,
        pais: esCafeLocal ? datosFormulario.pais : null, notas: esCafeLocal ? datosFormulario.notas : null,
        altura: esCafeLocal ? datosFormulario.altura : null, variedad: esCafeLocal ? datosFormulario.variedad : null, proceso: esCafeLocal ? datosFormulario.proceso : null
      };

      let idProd = datosFormulario.id_producto;

      if (idProd) {
        const { error } = await supabase.from('productos').update(datosProducto).eq('id_producto', idProd);
        if (error) throw error;

        if (esCafeLocal) {
            await supabase.from('formatos').delete().eq('id_producto', idProd);
            
            let listaFormatos = [];
            if (formatosEstandar.g250.activo) listaFormatos.push({ id_producto: idProd, nombre: '250g', precio: parseFloat(formatosEstandar.g250.precio), stock: parseInt(formatosEstandar.g250.stock) });
            if (formatosEstandar.g500.activo) listaFormatos.push({ id_producto: idProd, nombre: '500g', precio: parseFloat(formatosEstandar.g500.precio), stock: parseInt(formatosEstandar.g500.stock) });
            if (formatosEstandar.g1kg.activo) listaFormatos.push({ id_producto: idProd, nombre: '1kg', precio: parseFloat(formatosEstandar.g1kg.precio), stock: parseInt(formatosEstandar.g1kg.stock) });
            if (formatoPersonalizado.activo && formatoPersonalizado.nombre) {
              listaFormatos.push({ id_producto: idProd, nombre: formatoPersonalizado.nombre, precio: parseFloat(formatoPersonalizado.precio), stock: parseInt(formatoPersonalizado.stock) });
            }
            if (listaFormatos.length > 0) await supabase.from('formatos').insert(listaFormatos);

        } else {
           await supabase.from('formatos').update({ precio: parseFloat(datosFormulario.unico_precio), stock: esPrepLocal ? 99999 : parseInt(datosFormulario.unico_stock) }).eq('id_producto', idProd);
        }

      } else {
        const { data: nuevo, error } = await supabase.from('productos').insert([datosProducto]).select().single();
        if (error) throw error;
        idProd = nuevo.id_producto;
        let listaFormatos = [];
        if (esCafeLocal) {
            if (formatosEstandar.g250.activo) listaFormatos.push({ id_producto: idProd, nombre: '250g', precio: parseFloat(formatosEstandar.g250.precio), stock: parseInt(formatosEstandar.g250.stock) });
            if (formatosEstandar.g500.activo) listaFormatos.push({ id_producto: idProd, nombre: '500g', precio: parseFloat(formatosEstandar.g500.precio), stock: parseInt(formatosEstandar.g500.stock) });
            if (formatosEstandar.g1kg.activo) listaFormatos.push({ id_producto: idProd, nombre: '1kg', precio: parseFloat(formatosEstandar.g1kg.precio), stock: parseInt(formatosEstandar.g1kg.stock) });
            if (formatoPersonalizado.activo && formatoPersonalizado.nombre) {
              listaFormatos.push({ id_producto: idProd, nombre: formatoPersonalizado.nombre, precio: parseFloat(formatoPersonalizado.precio), stock: parseInt(formatoPersonalizado.stock) });
            }
        } else if (esPrepLocal) {
            listaFormatos.push({ id_producto: idProd, nombre: 'Estándar', precio: parseFloat(datosFormulario.unico_precio), stock: 99999, controlar_stock: false });
        } else {
            listaFormatos.push({ id_producto: idProd, nombre: 'Unidad', precio: parseFloat(datosFormulario.unico_precio), stock: parseInt(datosFormulario.unico_stock) });
        }
        if (listaFormatos.length > 0) await supabase.from('formatos').insert(listaFormatos);
      }
      
      alExito(idProd && productoAEditar ? 'Producto Modificado' : 'Producto Creado');
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <Form onSubmit={manejarEnvio}>
      {/* CAMBIO AQUÍ: Color beige forzado */}
      <h5 className="mb-4" style={{ color: 'var(--coffee-accent)' }}>
        {productoAEditar ? 'Editar' : 'Nuevo'} Producto
      </h5>
      
      <Form.Group className="mb-4">
        <Form.Label className="text-white-50">Categoría</Form.Label>
        <Form.Select name="id_categoria" value={esGrupoPreparacionSeleccionado ? 'grupo_preparacion' : datosFormulario.id_categoria} onChange={manejarCambioSelectorCategoria} size="lg" required disabled={!!productoAEditar} style={{backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #555'}}>
          <option value="" style={{color: 'black'}}>-- Seleccionar --</option>
          <option value="grupo_preparacion" style={{color: 'black'}}>Preparación / Barra</option>
          {categoriasGenerales.map(c => <option key={c.id_categoria} value={c.id_categoria} style={{color: 'black'}}>{c.nombre}</option>)}
        </Form.Select>
      </Form.Group>

      {esGrupoPreparacionSeleccionado && (
        <div className="mb-4 p-3 rounded" style={{border: '1px solid var(--coffee-accent)', background: 'rgba(196, 164, 132, 0.05)'}}>
          <Form.Label className="text-coffee-accent fw-bold mb-2">Tipo de preparación:</Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {categoriasPreparaciones.map(c => (
              <Button 
                key={c.id_categoria}
                variant="light"
                onClick={() => manejarClickSubCategoria(c.id_categoria)}
                className="fw-bold border-0"
                disabled={!!productoAEditar}
                style={{
                  backgroundColor: datosFormulario.id_categoria == c.id_categoria ? '#c4a484' : '#e9ecef',
                  color: datosFormulario.id_categoria == c.id_categoria ? '#fff' : '#495057',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  transition: 'all 0.2s'
                }}
              >
                {c.nombre}
              </Button>
            ))}
          </div>
        </div>
      )}

      {datosFormulario.id_categoria && (
        <div className="animate-fade-in">
          <Row className="mb-3">
            <Col md={8}><Form.Group><Form.Label className="text-white-50">Nombre</Form.Label><Form.Control name="nombre" value={datosFormulario.nombre} onChange={manejarCambioInput} required /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label className="text-white-50">Estado</Form.Label><Form.Select name="estado" value={datosFormulario.estado} onChange={manejarCambioInput}><option>Publicado</option><option>Borrador</option></Form.Select></Form.Group></Col>
          </Row>
          
          {esCafe && (
            <div className="p-3 rounded mb-4 border border-secondary" style={{backgroundColor: 'rgba(255,255,255,0.05)'}}>
                {/* CAMBIO AQUÍ: Color beige forzado */}
                <h6 className="fw-bold mb-3" style={{ color: 'var(--coffee-accent)' }}>Datos del Café</h6>
                <Row className="mb-2">
                    <Col><Form.Control name="pais" value={datosFormulario.pais} onChange={manejarCambioInput} placeholder="País" /></Col>
                    <Col><Form.Control name="altura" value={datosFormulario.altura} onChange={manejarCambioInput} placeholder="Altura" /></Col>
                </Row>
                <Row className="mb-2">
                    <Col><Form.Control name="variedad" value={datosFormulario.variedad} onChange={manejarCambioInput} placeholder="Variedad" /></Col>
                    <Col><Form.Control name="proceso" value={datosFormulario.proceso} onChange={manejarCambioInput} placeholder="Proceso" /></Col>
                </Row>
                <Form.Control name="notas" value={datosFormulario.notas} onChange={manejarCambioInput} placeholder="Notas de cata" />
            </div>
          )}

          <Form.Group className="mb-3"><Form.Label className="text-white-50">Descripción</Form.Label><Form.Control as="textarea" name="descripcion" value={datosFormulario.descripcion} onChange={manejarCambioInput} /></Form.Group>
          
          <Form.Group className="mb-4">
              <Form.Label className="text-white-50">Imagen</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={manejarSubidaImagen} disabled={subiendo} className="mb-2"/>
              <Form.Control type="text" name="imagen" value={datosFormulario.imagen} onChange={manejarCambioInput} placeholder="URL de la imagen" style={{backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', border:'1px solid #555'}} className="input-placeholder-light"/>
              <style>{`.input-placeholder-light::placeholder { color: rgba(255,255,255,0.5); }`}</style>
              {subiendo && <span className="text-warning small">Subiendo...</span>}
              {datosFormulario.imagen && !subiendo && <div className="mt-2"><img src={datosFormulario.imagen} alt="Previsualización" style={{height: '100px', borderRadius: '8px', border: '1px solid var(--coffee-accent)', objectFit: 'cover'}} /></div>}
          </Form.Group>
          
          {/* CAMBIO AQUÍ: Color beige forzado */}
          <h5 className="border-bottom border-secondary pb-2 mb-3" style={{ color: 'var(--coffee-accent)' }}>Precios y Stock</h5>
          
          {esCafe ? (
            <div>
                {['g250', 'g500', 'g1kg'].map((clave) => (
                    <Row key={clave} className="align-items-center mb-2">
                        <Col xs={3}><Form.Check type="switch" label={<span className="text-white fw-bold">{clave.replace('g','')}</span>} checked={formatosEstandar[clave].activo} onChange={(e) => manejarCambioEstandar(clave, 'activo', e.target.checked)} /></Col>
                        <Col><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" placeholder="Precio" value={formatosEstandar[clave].precio} onChange={(e) => manejarCambioEstandar(clave, 'precio', e.target.value)} disabled={!formatosEstandar[clave].activo} /></InputGroup></Col>
                        <Col><InputGroup><InputGroup.Text>Stock</InputGroup.Text><Form.Control type="number" value={formatosEstandar[clave].stock} onChange={(e) => manejarCambioEstandar(clave, 'stock', e.target.value)} disabled={!formatosEstandar[clave].activo} /></InputGroup></Col>
                    </Row>
                ))}
                <hr className="border-secondary my-3" />
                <Row className="align-items-center mb-2">
                    <Col xs={3}><Form.Check type="switch" label={<span className="text-white fw-bold">Otro</span>} checked={formatoPersonalizado.activo} onChange={(e) => setFormatoPersonalizado({...formatoPersonalizado, activo: e.target.checked})} /></Col>
                    <Col><Form.Control type="text" placeholder="Ej: 150g" value={formatoPersonalizado.nombre} onChange={(e) => setFormatoPersonalizado({...formatoPersonalizado, nombre: e.target.value})} disabled={!formatoPersonalizado.activo} /></Col>
                    <Col><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" placeholder="Precio" value={formatoPersonalizado.precio} onChange={(e) => setFormatoPersonalizado({...formatoPersonalizado, precio: e.target.value})} disabled={!formatoPersonalizado.activo} /></InputGroup></Col>
                    <Col><InputGroup><InputGroup.Text>Stock</InputGroup.Text><Form.Control type="number" value={formatoPersonalizado.stock} onChange={(e) => setFormatoPersonalizado({...formatoPersonalizado, stock: e.target.value})} disabled={!formatoPersonalizado.activo} /></InputGroup></Col>
                </Row>
            </div>
          ) : esPrep ? (
            <Row>
                <Col md={6}><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" name="unico_precio" value={datosFormulario.unico_precio} onChange={manejarCambioInput} required placeholder="Precio Venta" /></InputGroup></Col>
                <Col md={6} className="d-flex align-items-center text-white-50 mt-2"><span className="me-2 text-coffee-accent"><FaInfinity size={20}/></span> Stock ilimitado</Col>
            </Row>
          ) : (
            <Row>
                <Col md={6}><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" name="unico_precio" value={datosFormulario.unico_precio} onChange={manejarCambioInput} required placeholder="Precio" /></InputGroup></Col>
                <Col md={6}><InputGroup><InputGroup.Text>Stock</InputGroup.Text><Form.Control type="number" name="unico_stock" value={datosFormulario.unico_stock} onChange={manejarCambioInput} required /></InputGroup></Col>
            </Row>
          )}
          
          <div className="mt-4 d-flex justify-content-end">
            <Button variant="outline-light" onClick={alCancelar} className="me-2">Cancelar</Button>
            <Button className="btn-coffee-pill w-100 mt-0" type="submit" disabled={subiendo}>{subiendo ? 'Subiendo...' : (productoAEditar ? 'Guardar Cambios' : 'Crear Producto')}</Button>
          </div>
        </div>
      )}
    </Form>
  );
}

export default FormularioProductoAdmin;