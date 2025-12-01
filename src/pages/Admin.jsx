import { useState, useEffect } from 'react';
import { Container, Card, Alert, Tab, Tabs, Nav, Modal, Table, Badge, InputGroup, Form, Button } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { FaPlus, FaTrash, FaEdit, FaInfinity, FaSearch, FaEnvelope, FaBuilding, FaUser, FaChartBar, FaNewspaper, FaCheckCircle, FaEye } from 'react-icons/fa';
import './Admin.css';

import FormularioProductoAdmin from '../components/admin/FormularioProductoAdmin';
import TablaVentasAdmin from '../components/admin/TablaVentasAdmin';
import EstadisticasAdmin from '../components/admin/EstadisticasAdmin';
import InfoLocalAdmin from '../components/admin/InfoLocalAdmin';
import FormularioBlogAdmin from '../components/admin/FormularioBlogAdmin';

function Admin() {
  const [vista, setVista] = useState('lista'); 
  const [vistaBlog, setVistaBlog] = useState('lista'); 
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [blogAEditar, setBlogAEditar] = useState(null);
  
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busqueda, setBusqueda] = useState(''); 
  const [filtroMensajes, setFiltroMensajes] = useState('todos');

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [blogs, setBlogs] = useState([]);
  
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [datosNuevaCategoria, setDatosNuevaCategoria] = useState({ nombre: '' });

  // --- ESTADOS PARA VER MENSAJE COMPLETO ---
  const [mostrarModalMensaje, setMostrarModalMensaje] = useState(false);
  const [mensajeDetalle, setMensajeDetalle] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: catData } = await supabase.from('categoria').select('*');
      setCategorias(catData || []);

      const { data: prodData } = await supabase.from('productos').select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`) .order('id_producto', { ascending: false });
      setProductos(prodData || []);

      const { data: salesData } = await supabase.from('ordenes').select(`*, detalles_orden(*)`).order('fecha', { ascending: false });
      setVentas(salesData || []);

      const { data: msgData } = await supabase.from('mensajescontacto').select('*').order('fecha_envio', { ascending: false });
      setMensajes(msgData || []);

      const { data: blogData } = await supabase.from('blog').select('*').order('fecha_creacion', { ascending: false });
      setBlogs(blogData || []);

    } catch (error) { 
      setMensaje({ tipo: 'danger', texto: 'Error cargando datos.' }); 
    } finally { 
      setCargando(false); 
    }
  };

  const eliminarProducto = async (id) => { 
    if(!confirm("¿Eliminar producto?")) return; 
    await supabase.from('productos').delete().eq('id_producto', id); 
    cargarDatos(); 
    setToastMsg("Producto Eliminado");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  const irACrear = () => { setProductoAEditar(null); setVista('formulario'); };
  const irAEditar = (prod) => { setProductoAEditar(prod); setVista('formulario'); };
  
  const alExitoFormulario = (texto) => { 
    setToastMsg(texto); 
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    cargarDatos(); 
    setVista('lista'); 
  };

  const eliminarBlog = async (id) => { 
      if(!confirm("¿Eliminar esta entrada?")) return; 
      await supabase.from('blog').delete().eq('id', id); 
      cargarDatos(); 
      setToastMsg("Blog Eliminado");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };
  
  const irACrearBlog = () => { setBlogAEditar(null); setVistaBlog('formulario'); };
  const irAEditarBlog = (blog) => { setBlogAEditar(blog); setVistaBlog('formulario'); };
  
  const alExitoBlog = (texto) => { 
      setToastMsg(texto); 
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      cargarDatos(); 
      setVistaBlog('lista'); 
  };

  const eliminarMensaje = async (id) => { if(!confirm("¿Eliminar este mensaje?")) return; const { error } = await supabase.from('mensajescontacto').delete().eq('id_mensaje', id); if (error) return alert("Error: " + error.message); cargarDatos(); };
  
  const verMensaje = (msg) => {
    setMensajeDetalle(msg);
    setMostrarModalMensaje(true);
  };

  const obtenerNombreCategoria = (id) => categorias.find(c => c.id_categoria == id)?.nombre.toLowerCase() || '';
  const esPreparacion = (id) => { const n = obtenerNombreCategoria(id); return n.includes('preparación') || n.includes('filtrado') || n.includes('bebida') || n.includes('barra'); };
  
  const manejarBusqueda = (e) => {
    const termino = e.target.value;
    setBusqueda(termino);
    if (termino.trim() !== '') {
      const coincidencia = productos.find(p => p.nombre.toLowerCase().includes(termino.toLowerCase()));
      if (coincidencia) {
        const esPrep = esPreparacion(coincidencia.id_categoria);
        if (esPrep) { if (filtroCategoria !== 'preparaciones') setFiltroCategoria('preparaciones'); }
        else { if (filtroCategoria != coincidencia.id_categoria) setFiltroCategoria(coincidencia.id_categoria); }
      }
    }
  };

  const guardarCategoria = async () => {
    if (!datosNuevaCategoria.nombre) return alert("Nombre obligatorio");
    await supabase.from('categoria').insert([{ nombre: datosNuevaCategoria.nombre }]);
    setMostrarModalCategoria(false);
    setDatosNuevaCategoria({ nombre: '' });
    cargarDatos();
  };

  const productosFiltrados = productos.filter(p => {
    const esPrep = esPreparacion(p.id_categoria);
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (!cumpleBusqueda) return false;
    if (filtroCategoria === 'todos') return !esPrep; 
    else if (filtroCategoria === 'preparaciones') return esPrep; 
    else return p.id_categoria == filtroCategoria;
  });

  const mensajesFiltrados = mensajes.filter(m => {
    if (filtroMensajes === 'todos') return true;
    return m.tipo === filtroMensajes;
  });

  const categoriasGenerales = categorias.filter(c => !esPreparacion(c.id_categoria));

  return (
    <Container className="my-5 position-relative">
      <h2 className="mb-4 text-coffee-title">Panel de Administración</h2>
      {mensaje.texto && <Alert variant={mensaje.tipo} dismissible onClose={()=>setMensaje({})}>{mensaje.texto}</Alert>}

      <Tabs defaultActiveKey="dashboard" className="mb-4 main-tabs" variant="pills">
        <Tab eventKey="dashboard" title={<span><FaChartBar className="me-2"/>Dashboard</span>}>
          <EstadisticasAdmin />
        </Tab>

        <Tab eventKey="inventario" title="Inventario">
          {vista === 'lista' ? (
            <Card className="card-admin-dark border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <h5 className="mb-0 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Gestión de Productos</h5>
                  <div className="d-flex align-items-center gap-3">
                    <InputGroup size="sm" style={{ width: '250px' }}>
                      <InputGroup.Text style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--coffee-accent)', color: 'var(--coffee-accent)' }}><FaSearch /></InputGroup.Text>
                      <Form.Control placeholder="Buscar..." value={busqueda} onChange={manejarBusqueda} className="custom-search-input" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--coffee-accent)', color: 'var(--coffee-accent)' }} />
                    </InputGroup>
                    <button className="btn btn-coffee-pill shadow-none d-flex align-items-center gap-2" onClick={irACrear}><FaPlus /> Nuevo Producto</button>
                    <button className="btn btn-coffee-pill shadow-none d-flex align-items-center gap-2" onClick={() => setMostrarModalCategoria(true)}><FaPlus /> Nueva Categoría</button>
                  </div>
                </div>

                <Nav variant="pills" className="mb-4 nav-pills-coffee">
                  <Nav.Item><Nav.Link eventKey="todos" onClick={() => setFiltroCategoria('todos')} active={filtroCategoria === 'todos'}>Todos</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="preparaciones" onClick={() => setFiltroCategoria('preparaciones')} active={filtroCategoria === 'preparaciones'}>Preparaciones</Nav.Link></Nav.Item>
                  {categoriasGenerales.map(cat => ( <Nav.Item key={cat.id_categoria}><Nav.Link active={filtroCategoria == cat.id_categoria} onClick={() => setFiltroCategoria(cat.id_categoria)}>{cat.nombre}</Nav.Link></Nav.Item> ))}
                </Nav>

                <Table hover responsive className="align-middle table-dark-custom">
                  <thead><tr><th style={{paddingLeft:'1.5rem'}}>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th><th className="text-end" style={{paddingRight:'1.5rem'}}>Acción</th></tr></thead>
                  <tbody>{productosFiltrados.map(p => (
                    <tr key={p.id_producto}>
                      <td style={{paddingLeft: '1.5rem'}}><div className="d-flex align-items-center gap-3"><div className="product-image-premium">{p.imagen && <img src={p.imagen} alt={p.nombre} />}</div><div><div className="product-title-premium">{p.nombre}</div><div className="product-category-premium">{p.categoria?.nombre}</div></div></div></td>
                      <td className="fw-bold text-coffee-accent">${p.formatos?.[0]?.precio?.toLocaleString()}</td>
                      <td>{p.formatos?.length > 0 && p.formatos[0].stock > 9000 ? <FaInfinity color="var(--coffee-accent)"/> : p.formatos?.reduce((acc,f)=>acc+f.stock,0)}</td>
                      <td><Badge bg={p.estado === 'Publicado' ? 'success' : 'secondary'}>{p.estado}</Badge></td>
                      <td className="text-end" style={{paddingRight: '1.5rem'}}><Button size="sm" className="me-2 btn-action-pill" onClick={()=>irAEditar(p)}><FaEdit /></Button><Button size="sm" className="btn-action-pill delete" onClick={()=>eliminarProducto(p.id_producto)}><FaTrash /></Button></td>
                    </tr>
                  ))}</tbody>
                </Table>
                
                {productosFiltrados.length === 0 && <div className="text-center py-5 text-muted">No se encontraron productos.</div>}
              </Card.Body>
            </Card>
          ) : (
             <Card className="card-admin-dark border-0">
               <Card.Body className="p-4">
                 <FormularioProductoAdmin productoAEditar={productoAEditar} categorias={categorias} alCancelar={() => setVista('lista')} alExito={alExitoFormulario} />
               </Card.Body>
             </Card>
          )}
        </Tab>

        <Tab eventKey="blog" title={<span><FaNewspaper className="me-2"/>Blog</span>}>
          {vistaBlog === 'lista' ? (
            <Card className="card-admin-dark border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Gestión de Blog</h5>
                  <button className="btn btn-coffee-pill shadow-none d-flex align-items-center gap-2" onClick={irACrearBlog}>
                    <FaPlus /> Nueva Historia
                  </button>
                </div>

                <Table hover responsive className="align-middle table-dark-custom">
                  <thead>
                    <tr>
                      <th style={{paddingLeft:'1.5rem'}}>Imagen</th>
                      <th>Título</th>
                      <th>Fecha</th>
                      <th className="text-end" style={{paddingRight:'1.5rem'}}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map(b => (
                      <tr key={b.id}>
                        <td style={{paddingLeft: '1.5rem', width: '100px'}}>
                          <div className="product-image-premium" style={{width: '60px', height: '60px'}}>
                            {b.imagen ? <img src={b.imagen} alt="blog" /> : <div className="w-100 h-100 bg-secondary"></div>}
                          </div>
                        </td>
                        <td><div className="fw-bold text-white">{b.titulo}</div></td>
                        <td className="text-white-50">{new Date(b.fecha_creacion).toLocaleDateString()}</td>
                        <td className="text-end" style={{paddingRight: '1.5rem'}}>
                          <Button size="sm" className="me-2 btn-action-pill" onClick={() => irAEditarBlog(b)}><FaEdit /></Button>
                          <Button size="sm" className="btn-action-pill delete" onClick={() => eliminarBlog(b.id)}><FaTrash /></Button>
                        </td>
                      </tr>
                    ))}
                    {blogs.length === 0 && <tr><td colSpan="4" className="text-center py-5 text-muted">No hay entradas en el blog.</td></tr>}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Card className="card-admin-dark border-0">
              <Card.Body className="p-4">
                <FormularioBlogAdmin 
                  blogAEditar={blogAEditar} 
                  alCancelar={() => setVistaBlog('lista')} 
                  alExito={alExitoBlog} 
                />
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab eventKey="ventas" title="Ventas">
          <Card className="card-admin-dark border-0">
            <Card.Body className="p-4">
              <TablaVentasAdmin ventas={ventas} alRefrescar={cargarDatos} />
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="mensajes" title="Mensajes">
          <Card className="card-admin-dark border-0">
            <Card.Body className="p-4">
              <h5 className="text-coffee-title mb-4" style={{ color: 'var(--coffee-accent)' }}>Mensajes de Contacto</h5>
              <Nav variant="pills" className="mb-4 nav-pills-coffee">
                <Nav.Item><Nav.Link active={filtroMensajes === 'todos'} onClick={() => setFiltroMensajes('todos')}>Todos</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link active={filtroMensajes === 'general'} onClick={() => setFiltroMensajes('general')}><FaUser className="me-1"/> General</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link active={filtroMensajes === 'mayorista'} onClick={() => setFiltroMensajes('mayorista')}><FaBuilding className="me-1"/> Mayorista</Nav.Link></Nav.Item>
              </Nav>

              {mensajesFiltrados.length === 0 ? (
                <p className="text-center py-5 text-muted">No hay mensajes en esta categoría.</p>
              ) : (
                <Table hover responsive className="align-middle table-dark-custom">
                  <thead>
                    <tr>
                      <th style={{paddingLeft:'1.5rem'}}>Fecha</th>
                      <th>Remitente</th>
                      <th>Tipo</th>
                      <th>Mensaje</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mensajesFiltrados.map(m => (
                      <tr key={m.id_mensaje}>
                        <td style={{paddingLeft: '1.5rem'}}>
                          <div className="d-flex align-items-center gap-2">
                            <FaEnvelope className="text-coffee-accent"/>
                            <small className="text-white-50">{new Date(m.fecha_envio).toLocaleDateString()}</small>
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold text-white">{m.nombre_remitente}</div>
                          <div className="small text-white">{m.correo_remitente}</div> 
                          {m.tipo === 'mayorista' && <div className="small text-warning mt-1">{m.nombre_empresa} (RUT: {m.rut_empresa})</div>}
                        </td>
                        <td>
                          <Badge bg={m.tipo === 'mayorista' ? 'warning' : 'info'} text="dark" className="px-3">
                            {m.tipo === 'mayorista' ? 'Mayorista' : 'General'}
                          </Badge>
                        </td>
                        <td style={{maxWidth: '300px'}}>
                          <p className="mb-0 text-white-50 small text-truncate" title={m.mensaje}>
                            {m.mensaje}
                          </p>
                        </td>
                        <td className="text-end" style={{paddingRight: '1.5rem'}}>
                          <Button size="sm" className="me-2 btn-action-pill" onClick={() => verMensaje(m)}><FaEye /></Button>
                          <Button size="sm" className="btn-action-pill delete" onClick={() => eliminarMensaje(m.id_mensaje)}><FaTrash /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="config" title="Configuración">
          <InfoLocalAdmin />
        </Tab>

      </Tabs>

      <Modal show={mostrarModalCategoria} onHide={() => setMostrarModalCategoria(false)} centered contentClassName="card-admin-dark border-0">
        <Modal.Header closeButton closeVariant="white" className="border-secondary"><Modal.Title className="text-coffee-accent">Nueva Categoría</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label className="text-white-50">Nombre</Form.Label><Form.Control value={datosNuevaCategoria.nombre} onChange={(e) => setDatosNuevaCategoria({nombre: e.target.value})} placeholder="Ej: Té" /></Form.Group>
          <Button className="btn-coffee-pill w-100 border-0" onClick={guardarCategoria}>Crear</Button>
        </Modal.Body>
      </Modal>

      {/* --- MODAL VER MENSAJE COMPLETO --- */}
      <Modal show={mostrarModalMensaje} onHide={() => setMostrarModalMensaje(false)} centered contentClassName="card-admin-dark border-0">
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="text-coffee-accent">Detalle del Mensaje</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-white">
          {mensajeDetalle && (
            <>
              <p><strong>De:</strong> {mensajeDetalle.nombre_remitente} ({mensajeDetalle.correo_remitente})</p>
              <p><strong>Fecha:</strong> {new Date(mensajeDetalle.fecha_envio).toLocaleString()}</p>
              {mensajeDetalle.tipo === 'mayorista' && (
                 <div className="p-2 mb-3 bg-warning bg-opacity-10 rounded border border-warning">
                    <strong>Datos Empresa:</strong><br/>
                    {mensajeDetalle.nombre_empresa}<br/>
                    RUT: {mensajeDetalle.rut_empresa}<br/>
                    Volumen: {mensajeDetalle.volumen_estimado}
                 </div>
              )}
              <hr className="border-secondary"/>
              <p style={{whiteSpace: 'pre-wrap'}}>{mensajeDetalle.mensaje}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="outline-light" onClick={() => setMostrarModalMensaje(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

      <div className={`aesthetic-toast ${showToast ? 'show' : ''}`}>
        <FaCheckCircle className="text-success fs-4" />
        <div>
          <div className="fw-bold">¡Éxito!</div>
          <small className="text-white-50">{toastMsg}</small>
        </div>
      </div>

    </Container>
  );
}

export default Admin;