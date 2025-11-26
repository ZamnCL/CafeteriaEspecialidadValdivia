import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table, Card, Alert, Badge, Spinner, InputGroup, Tab, Tabs, Nav } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { FaTrash, FaEdit, FaPlus, FaInfinity } from 'react-icons/fa';
import './Admin.css';

function Admin() {
  // --- ESTADOS ---
  const [vista, setVista] = useState('lista'); 
  const [modoEdicion, setModoEdicion] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // --- FORMULARIO ---
  const initialFormState = {
    id_producto: null,
    nombre: '', descripcion: '', imagen: '',
    id_categoria: '', estado: 'Publicado',
    pais: '', notas: '', altura: '', variedad: '', proceso: '',
    unico_precio: '', unico_stock: 10
  };
  const [formData, setFormData] = useState(initialFormState);

  const [formatosStd, setFormatosStd] = useState({
    g250: { active: true, precio: '', stock: 10 },
    g500: { active: true, precio: '', stock: 5 },
    g1kg: { active: true, precio: '', stock: 2 }
  });

  // --- CARGA DATOS ---
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from('categoria').select('*');
      setCategorias(catData || []);

      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
        .order('id_producto', { ascending: false });

      if (prodError) throw prodError;
      setProductos(prodData || []);

      const { data: salesData } = await supabase.from('ordenes').select('*').order('fecha', { ascending: false });
      setVentas(salesData || []);

      const { data: msgData } = await supabase.from('mensajes_contacto').select('*').order('fecha', { ascending: false });
      setMensajes(msgData || []);

    } catch (error) {
      console.error(error);
      setMsg({ type: 'danger', text: 'Error cargando datos.' });
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---
  const getCategoriaNombre = (id) => categorias.find(c => c.id_categoria == id)?.nombre.toLowerCase() || '';
  const esCafeGrano = (id) => { const n = getCategoriaNombre(id); return n.includes('grano') || n.includes('tostado') || n.includes('origen'); };
  const esPreparacion = (id) => { const n = getCategoriaNombre(id); return n.includes('preparaci') || n.includes('bebida') || n.includes('barra') || n.includes('filtrado'); };

  // --- MANEJADORES ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleStdChange = (k, f, v) => setFormatosStd(prev => ({ ...prev, [k]: { ...prev[k], [f]: v } }));

  // SUBIDA DE IMAGEN
  const subirImagen = async (file) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('imagenes-productos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('imagenes-productos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      alert("Error subida: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await subirImagen(file);
    if (url) setFormData(prev => ({ ...prev, imagen: url }));
  };

  // NAVEGACIÓN
  const irACrear = () => {
    setFormData(initialFormState);
    setFormatosStd({ g250: { active: true, precio: '', stock: 10 }, g500: { active: true, precio: '', stock: 5 }, g1kg: { active: true, precio: '', stock: 2 } });
    setModoEdicion(false);
    setVista('formulario');
  };

  const irAEditar = (prod) => {
    setFormData({
      id_producto: prod.id_producto, nombre: prod.nombre, descripcion: prod.descripcion || '', imagen: prod.imagen || '',
      id_categoria: prod.id_categoria, estado: prod.estado, pais: prod.pais || '', notas: prod.notas || '',
      altura: prod.altura || '', variedad: prod.variedad || '', proceso: prod.proceso || '',
      unico_precio: prod.formatos?.[0]?.precio || '', unico_stock: prod.formatos?.[0]?.stock || 0
    });
    setModoEdicion(true);
    setVista('formulario');
  };

  const eliminarProducto = async (id) => {
    if(!confirm("¿Eliminar producto?")) return;
    await supabase.from('productos').delete().eq('id_producto', id);
    fetchData();
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!formData.id_categoria) return alert("Falta Categoría");
    const isCafe = esCafeGrano(formData.id_categoria);
    const isPrep = esPreparacion(formData.id_categoria);

    try {
      const datos = {
        nombre: formData.nombre, descripcion: formData.descripcion, imagen: formData.imagen,
        id_categoria: parseInt(formData.id_categoria), estado: formData.estado,
        pais: isCafe ? formData.pais : null, notas: isCafe ? formData.notas : null,
        altura: isCafe ? formData.altura : null, variedad: isCafe ? formData.variedad : null, proceso: isCafe ? formData.proceso : null
      };

      let prodId = formData.id_producto;
      if (modoEdicion) {
        await supabase.from('productos').update(datos).eq('id_producto', prodId);
        setMsg({ type: 'success', text: 'Actualizado correctamente.' });
      } else {
        const { data: nuevo, error } = await supabase.from('productos').insert([datos]).select().single();
        if (error) throw error;
        prodId = nuevo.id_producto;

        let fmts = [];
        if (isCafe) {
            if (formatosStd.g250.active) fmts.push({ id_producto: prodId, nombre: '250g', precio: parseFloat(formatosStd.g250.precio), stock: parseInt(formatosStd.g250.stock) });
            if (formatosStd.g500.active) fmts.push({ id_producto: prodId, nombre: '500g', precio: parseFloat(formatosStd.g500.precio), stock: parseInt(formatosStd.g500.stock) });
            if (formatosStd.g1kg.active) fmts.push({ id_producto: prodId, nombre: '1kg', precio: parseFloat(formatosStd.g1kg.precio), stock: parseInt(formatosStd.g1kg.stock) });
        } else if (isPrep) {
            fmts.push({ id_producto: prodId, nombre: 'Estándar', precio: parseFloat(formData.unico_precio), stock: 99999 });
        } else {
            fmts.push({ id_producto: prodId, nombre: 'Unidad', precio: parseFloat(formData.unico_precio), stock: parseInt(formData.unico_stock) });
        }
        if (fmts.length > 0) await supabase.from('formatos').insert(fmts);
        setMsg({ type: 'success', text: 'Producto creado.' });
      }
      fetchData();
      setVista('lista');
    } catch (error) {
      setMsg({ type: 'danger', text: error.message });
    }
  };

  const productosFiltrados = filtroCategoria === 'todos' ? productos : productos.filter(p => p.id_categoria == filtroCategoria);
  const isCafe = esCafeGrano(formData.id_categoria);
  const isPrep = esPreparacion(formData.id_categoria);

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-coffee-title">Panel de Administración</h2>
      {msg.text && <Alert variant={msg.type} dismissible onClose={()=>setMsg({})}>{msg.text}</Alert>}

      <Tabs defaultActiveKey="inventario" className="mb-4 main-tabs" variant="pills">
        
        <Tab eventKey="inventario" title="Inventario">
          {vista === 'lista' ? (
            <Card className="card-admin-dark border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>
                    Gestión de Productos
                  </h5>
                  <button className="btn btn-coffee-pill shadow-none" onClick={irACrear}>
                    <FaPlus /> Nuevo Producto
                  </button>
                </div>

                <Nav variant="pills" className="mb-4 nav-pills-coffee">
                  <Nav.Item>
                    <Nav.Link eventKey="todos" onClick={() => setFiltroCategoria('todos')} active={filtroCategoria === 'todos'}>
                      Todos
                    </Nav.Link>
                  </Nav.Item>
                  {categorias.map(cat => (
                    <Nav.Item key={cat.id_categoria}>
                      <Nav.Link eventKey={cat.id_categoria} onClick={() => setFiltroCategoria(cat.id_categoria)} active={filtroCategoria == cat.id_categoria}>
                        {cat.nombre}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
                
                {loading ? <div className="text-center p-4"><Spinner animation="border" variant="light"/></div> : (
                  <Table hover responsive className="align-middle table-dark-custom">
                    <thead>
                      <tr>
                        <th style={{paddingLeft: '1.5rem'}}>Producto / Categoría</th>
                        <th>Precio Ref.</th>
                        <th>Stock Detalle</th>
                        <th>Estado</th>
                        <th className="text-end" style={{paddingRight: '1.5rem'}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map(p => (
                        <tr key={p.id_producto}>
                          <td style={{paddingLeft: '1.5rem'}}>
                            <div className="d-flex align-items-center gap-3">
                              <div className="product-image-premium">
                                {p.imagen ? (
                                  <img src={p.imagen} alt={p.nombre} />
                                ) : (
                                  <div className="d-flex align-items-center justify-content-center h-100 text-muted small bg-dark">Sin img</div>
                                )}
                              </div>
                              <div>
                                <div className="product-title-premium">{p.nombre}</div>
                                <div className="product-category-premium">{p.categoria?.nombre}</div>
                              </div>
                            </div>
                          </td>

                          <td className="fw-bold text-coffee-accent fs-5">
                            ${p.formatos?.[0]?.precio?.toLocaleString()}
                          </td>
                          
                          <td>
                            <div className="d-flex flex-column align-items-start gap-1">
                              {p.formatos?.map(f => {
                                const esInfinito = f.stock >= 90000;
                                return (
                                  <div key={f.id_formato} className="stock-detail-pill">
                                    {!esInfinito && <span className="text-white-50 me-2" style={{fontSize:'0.8rem'}}>{f.nombre}:</span>}
                                    <span className={f.stock < 5 && !esInfinito ? 'text-danger fw-bold' : 'text-white fw-bold'}>
                                      {esInfinito ? <FaInfinity style={{color: 'var(--coffee-accent)', fontSize: '1rem'}} /> : f.stock}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          <td><Badge bg={p.estado === 'Publicado' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">{p.estado}</Badge></td>
                          
                          <td className="text-end" style={{paddingRight: '1.5rem'}}>
                            <Button size="sm" className="me-2 btn-action-pill" onClick={()=>irAEditar(p)}>
                              <FaEdit />
                            </Button>
                            <Button size="sm" className="btn-action-pill delete" onClick={()=>eliminarProducto(p.id_producto)}>
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {productosFiltrados.length === 0 && <tr><td colSpan="6" className="text-center py-5"><h5 className="text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Sin productos</h5></td></tr>}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          ) : (
            // --- FORMULARIO ---
            <Card className="card-admin-dark border-0">
              <Card.Header className="card-header-dark py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h5>
                <Button variant="outline-light" size="sm" onClick={() => setVista('lista')}>Cancelar</Button>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={guardarProducto}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-white-50">Categoría</Form.Label>
                    <Form.Select name="id_categoria" value={formData.id_categoria} onChange={handleChange} size="lg" required disabled={modoEdicion}>
                      <option value="">-- Seleccionar --</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                    </Form.Select>
                  </Form.Group>

                  {formData.id_categoria && (
                    <div>
                      <Row className="mb-3">
                        <Col md={8}><Form.Group><Form.Label className="text-white-50">Nombre</Form.Label><Form.Control name="nombre" value={formData.nombre} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label className="text-white-50">Estado</Form.Label><Form.Select name="estado" value={formData.estado} onChange={handleChange}><option>Publicado</option><option>Borrador</option></Form.Select></Form.Group></Col>
                      </Row>

                      {isCafe && (
                        <div className="p-3 rounded mb-4 border border-secondary" style={{backgroundColor: 'rgba(255,255,255,0.05)'}}>
                          <h6 className="text-coffee-accent fw-bold mb-3">Datos del Café</h6>
                          <Row className="mb-2"><Col><Form.Control name="pais" value={formData.pais} onChange={handleChange} placeholder="País" /></Col><Col><Form.Control name="altura" value={formData.altura} onChange={handleChange} placeholder="Altura" /></Col></Row>
                          <Row className="mb-2"><Col><Form.Control name="variedad" value={formData.variedad} onChange={handleChange} placeholder="Variedad" /></Col><Col><Form.Control name="proceso" value={formData.proceso} onChange={handleChange} placeholder="Proceso" /></Col></Row>
                          <Form.Control name="notas" value={formData.notas} onChange={handleChange} placeholder="Notas de cata" />
                        </div>
                      )}

                      <Form.Group className="mb-3"><Form.Label className="text-white-50">Descripción</Form.Label><Form.Control as="textarea" name="descripcion" value={formData.descripcion} onChange={handleChange} /></Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="text-white-50">Imagen</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="mb-2"/>
                        <Form.Control type="text" name="imagen" value={formData.imagen} onChange={handleChange} placeholder="URL" style={{backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', border:'1px solid #555'}} />
                        {uploading && <span className="text-warning small">Subiendo...</span>}
                        {formData.imagen && !uploading && <div className="mt-2"><img src={formData.imagen} alt="Previsualización" style={{height: '100px', borderRadius: '8px', border: '1px solid var(--coffee-accent)', objectFit: 'cover'}} /></div>}
                      </Form.Group>

                      <h5 className="border-bottom border-secondary pb-2 mb-3 text-coffee-accent">Precios y Stock</h5>
                      
                      {isCafe ? (
                        <div>
                          {['g250', 'g500', 'g1kg'].map((key) => (
                            <Row key={key} className="align-items-center mb-2">
                              <Col xs={3}>
                                <Form.Check 
                                  type="switch" 
                                  label={<span className="text-white fw-bold">{key.replace('g','')}</span>}
                                  checked={formatosStd[key].active} 
                                  onChange={(e) => handleStdChange(key, 'active', e.target.checked)} 
                                />
                              </Col>
                              <Col><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" placeholder="Precio" value={formatosStd[key].precio} onChange={(e) => handleStdChange(key, 'precio', e.target.value)} disabled={!formatosStd[key].active} /></InputGroup></Col>
                              <Col><InputGroup><InputGroup.Text>Stock</InputGroup.Text><Form.Control type="number" value={formatosStd[key].stock} onChange={(e) => handleStdChange(key, 'stock', e.target.value)} disabled={!formatosStd[key].active} /></InputGroup></Col>
                            </Row>
                          ))}
                        </div>
                      ) : isPrep ? (
                        <Row>
                          <Col md={6}><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" name="unico_precio" value={formData.unico_precio} onChange={handleChange} required placeholder="Precio Venta" /></InputGroup></Col>
                          <Col md={6} className="d-flex align-items-center text-white-50 mt-2">
                             <span className="me-2 text-coffee-accent"><FaInfinity size={20}/></span> Stock ilimitado
                          </Col>
                        </Row>
                      ) : (
                        <Row>
                          <Col md={6}><InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" name="unico_precio" value={formData.unico_precio} onChange={handleChange} required placeholder="Precio" /></InputGroup></Col>
                          <Col md={6}><InputGroup><InputGroup.Text>Stock</InputGroup.Text><Form.Control type="number" name="unico_stock" value={formData.unico_stock} onChange={handleChange} required /></InputGroup></Col>
                        </Row>
                      )}

                      <Button className="btn-coffee-pill w-100 mt-4 btn-lg border-0 justify-content-center" type="submit" disabled={uploading}>
                        {uploading ? 'Subiendo...' : (modoEdicion ? 'Guardar Cambios' : 'Crear Producto')}
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="ventas" title="Ventas">
          <Card className="card-admin-dark border-0">
            <Card.Body>
              <h5 className="mb-3 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Historial de Ventas</h5>
              {ventas.length === 0 ? <div className="text-center py-5"><h5 className="text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Sin registros</h5></div> : (
                <Table striped hover responsive size="sm" className="table-dark-custom">
                  <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {ventas.map(v => (
                      <tr key={v.id_orden}>
                        <td>#{v.id_orden}</td><td>{v.nombre} {v.apellido}</td><td className="fw-bold text-white">${v.total?.toLocaleString()}</td>
                        <td><Badge bg={v.estado === 'Pagado' ? 'success' : 'warning'}>{v.estado}</Badge></td>
                        <td>{new Date(v.fecha).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="mensajes" title="Mensajes">
          <Card className="card-admin-dark border-0">
            <Card.Body>
              <h5 className="mb-3 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Mensajes de Contacto</h5>
              {mensajes.length === 0 ? <div className="text-center py-5"><h5 className="text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>No hay mensajes</h5></div> : (
                <Table striped hover responsive size="sm" className="table-dark-custom">
                  <thead><tr><th>Fecha</th><th>Nombre</th><th>Email</th><th>Mensaje</th></tr></thead>
                  <tbody>
                    {mensajes.map(m => (
                      <tr key={m.id_mensaje}>
                        <td style={{width:'100px'}}>{new Date(m.fecha).toLocaleDateString()}</td>
                        <td className="fw-bold text-white">{m.nombre}</td>
                        <td><a href={`mailto:${m.email}`} className="text-coffee-accent text-decoration-none">{m.email}</a></td>
                        <td className="text-white-50">{m.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

      </Tabs>
    </Container>
  );
}

export default Admin;