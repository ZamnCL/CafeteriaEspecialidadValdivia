import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table, Card, Alert, Badge, Spinner, InputGroup, Tab, Tabs, Nav, Modal, Image } from 'react-bootstrap';
import { supabase } from '../supabase/cliente';
import { FaTrash, FaEdit, FaPlus, FaInfinity, FaMugHot, FaSnowflake, FaList, FaFilter, FaSearch, FaCheck, FaTimes, FaEye, FaClock, FaCheckCircle, FaBan, FaHistory } from 'react-icons/fa';
import './Admin.css';

function Admin() {
  // --- ESTADOS ---
  const [vista, setVista] = useState('lista'); 
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // FILTROS PRODUCTOS
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [subFiltroPrep, setSubFiltroPrep] = useState('todas');
  const [busqueda, setBusqueda] = useState(''); 

  // FILTROS VENTAS (NUEVO)
  const [filtroVentas, setFiltroVentas] = useState('pendientes'); // Por defecto mostramos lo urgente

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // ESTADOS MODALES
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatData, setNewCatData] = useState({ nombre: '' });
  
  const [showComprobante, setShowComprobante] = useState(false);
  const [imgComprobante, setImgComprobante] = useState('');

  // FORMULARIO PRODUCTO
  const initialFormState = {
    id_producto: null, nombre: '', descripcion: '', imagen: '', id_categoria: '', estado: 'Publicado',
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

      const { data: prodData } = await supabase
        .from('productos')
        .select(`*, categoria:categoria!productos_id_categoria_fkey (nombre), formatos:formatos!formatos_id_producto_fkey (*)`)
        .order('id_producto', { ascending: false });
      setProductos(prodData || []);

      const { data: salesData } = await supabase
        .from('ordenes')
        .select('*')
        .order('fecha', { ascending: false });
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

  // --- LOGICA VENTAS ---
  const cambiarEstadoOrden = async (idOrden, nuevoEstado) => {
    const accion = nuevoEstado === 'Completado' ? 'Aprobar' : 'Rechazar';
    if (!confirm(`¿Estás seguro de ${accion} esta venta?`)) return;
    
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id_orden', idOrden);
      
      if (error) throw error;
      
      setMsg({ type: 'success', text: `Orden #${idOrden} actualizada a ${nuevoEstado}` });
      fetchData(); // Recargamos para que se mueva de pestaña
    } catch (err) {
      alert(err.message);
    }
  };

  const verComprobante = (url) => {
    setImgComprobante(url);
    setShowComprobante(true);
  };

  // Filtrado de Ventas
  const ventasFiltradas = ventas.filter(v => {
    if (filtroVentas === 'todos') return true;
    if (filtroVentas === 'pendientes') return v.estado === 'Por Confirmar';
    if (filtroVentas === 'aprobados') return v.estado === 'Completado';
    if (filtroVentas === 'rechazados') return v.estado === 'Rechazado';
    return true;
  });

  // --- HELPERS Y MANEJADORES DE PRODUCTO ---
  const getCategoriaNombre = (id) => categorias.find(c => c.id_categoria == id)?.nombre.toLowerCase() || '';
  const esCafeGrano = (id) => { const n = getCategoriaNombre(id); return n.includes('grano') || n.includes('tostado') || n.includes('origen'); };
  const esPreparacion = (id) => { const n = getCategoriaNombre(id); return n.includes('preparación') || n.includes('filtrado') || n.includes('bebida') || n.includes('barra'); };

  const handleSearch = (e) => {
    const term = e.target.value;
    setBusqueda(term);
    if (term.trim() !== '') {
      const match = productos.find(p => p.nombre.toLowerCase().includes(term.toLowerCase()));
      if (match) {
        const esPrep = esPreparacion(match.id_categoria);
        if (esPrep) {
           if (filtroCategoria !== 'preparaciones') setFiltroCategoria('preparaciones');
        } else {
           if (filtroCategoria != match.id_categoria) setFiltroCategoria(match.id_categoria);
        }
      }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleStdChange = (k, f, v) => setFormatosStd(prev => ({ ...prev, [k]: { ...prev[k], [f]: v } }));

  const subirImagen = async (file) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
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

  const guardarCategoria = async () => {
    if (!newCatData.nombre) return alert("Nombre obligatorio");
    try {
      const { error } = await supabase.from('categoria').insert([{ nombre: newCatData.nombre }]);
      if (error) throw error;
      setMsg({ type: 'success', text: 'Categoría creada.' });
      setShowCatModal(false);
      setNewCatData({ nombre: '' });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
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
        const { error: errProd } = await supabase.from('productos').update(datos).eq('id_producto', prodId);
        if (errProd) throw errProd;
        
        if (!isCafe) {
           const { data: formatosExistentes } = await supabase.from('formatos').select('id_formato').eq('id_producto', prodId);
           if (formatosExistentes && formatosExistentes.length > 0) {
               const { error: errFmt } = await supabase.from('formatos')
                 .update({ precio: parseFloat(formData.unico_precio), stock: isPrep ? 99999 : parseInt(formData.unico_stock) })
                 .eq('id_producto', prodId);
               if (errFmt) throw errFmt;
           } else {
               const { error: errNewFmt } = await supabase.from('formatos').insert([{
                   id_producto: prodId, nombre: isPrep ? 'Estándar' : 'Unidad', precio: parseFloat(formData.unico_precio), stock: isPrep ? 99999 : parseInt(formData.unico_stock), controlar_stock: !isPrep
               }]);
               if (errNewFmt) throw errNewFmt;
           }
        }
        setMsg({ type: 'success', text: 'Producto actualizado.' });
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
            fmts.push({ id_producto: prodId, nombre: 'Estándar', precio: parseFloat(formData.unico_precio), stock: 99999, controlar_stock: false });
        } else {
            fmts.push({ id_producto: prodId, nombre: 'Unidad', precio: parseFloat(formData.unico_precio), stock: parseInt(formData.unico_stock) });
        }
        if (fmts.length > 0) await supabase.from('formatos').insert(fmts);
        setMsg({ type: 'success', text: 'Producto creado.' });
      }
      fetchData();
      setVista('lista');
    } catch (error) {
      setMsg({ type: 'danger', text: "Error: " + error.message });
    }
  };

  const eliminarProducto = async (id) => {
    if(!confirm("¿Eliminar?")) return;
    await supabase.from('productos').delete().eq('id_producto', id);
    fetchData();
  };

  const irACrear = () => { 
      setFormData(initialFormState); 
      setModoEdicion(false); 
      setFormatosStd({ g250: { active: true, precio: '', stock: 10 }, g500: { active: true, precio: '', stock: 5 }, g1kg: { active: true, precio: '', stock: 2 } });
      setVista('formulario'); 
  };

  const irAEditar = (prod) => {
    setFormData({ ...prod, unico_precio: prod.formatos?.[0]?.precio || '', unico_stock: prod.formatos?.[0]?.stock || 0 });
    setModoEdicion(true); 
    setVista('formulario');
  };

  const productosFiltrados = productos.filter(p => {
    const esPrep = esPreparacion(p.id_categoria);
    const catNombre = getCategoriaNombre(p.id_categoria);
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (!cumpleBusqueda) return false;
    if (filtroCategoria === 'todos') return !esPrep; 
    else if (filtroCategoria === 'preparaciones') {
      if (!esPrep) return false;
      if (subFiltroPrep === 'calientes') return catNombre.includes('caliente');
      if (subFiltroPrep === 'frias') return catNombre.includes('fría') || catNombre.includes('fria');
      if (subFiltroPrep === 'filtrados') return catNombre.includes('filtrado');
      return true;
    } else return p.id_categoria == filtroCategoria;
  });

  const isCafe = esCafeGrano(formData.id_categoria);
  const isPrep = esPreparacion(formData.id_categoria);

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-coffee-title">Panel de Administración</h2>
      {msg.text && <Alert variant={msg.type} dismissible onClose={()=>setMsg({})}>{msg.text}</Alert>}

      <Tabs defaultActiveKey="inventario" className="mb-4 main-tabs" variant="pills">
        
        {/* TAB INVENTARIO */}
        <Tab eventKey="inventario" title="Inventario">
          {vista === 'lista' ? (
            <Card className="card-admin-dark border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <h5 className="mb-0 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Gestión de Productos</h5>
                  <div className="d-flex align-items-center gap-3">
                    <InputGroup size="sm" style={{ width: '250px' }}>
                      <InputGroup.Text style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--coffee-accent)', color: 'var(--coffee-accent)' }}><FaSearch /></InputGroup.Text>
                      <Form.Control placeholder="Buscar..." value={busqueda} onChange={handleSearch} className="custom-search-input" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--coffee-accent)', color: 'var(--coffee-accent)' }} />
                      <style>{`.custom-search-input::placeholder { color: var(--coffee-accent) !important; opacity: 0.7; }`}</style>
                    </InputGroup>
                    <button className="btn btn-coffee-pill shadow-none d-flex align-items-center gap-2" onClick={irACrear}><FaPlus /> Nuevo Producto</button>
                    <button className="btn btn-coffee-pill shadow-none d-flex align-items-center gap-2" onClick={() => setShowCatModal(true)}><FaPlus /> Nueva Categoría</button>
                  </div>
                </div>

                <Nav variant="pills" className="mb-4 nav-pills-coffee">
                  <Nav.Item><Nav.Link eventKey="todos" onClick={() => setFiltroCategoria('todos')} active={filtroCategoria === 'todos'}>Todos</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="preparaciones" onClick={() => setFiltroCategoria('preparaciones')} active={filtroCategoria === 'preparaciones'}>Preparaciones</Nav.Link></Nav.Item>
                  {categorias.filter(cat => !esPreparacion(cat.id_categoria)).map(cat => (
                    <Nav.Item key={cat.id_categoria}><Nav.Link active={filtroCategoria == cat.id_categoria} onClick={() => setFiltroCategoria(cat.id_categoria)}>{cat.nombre}</Nav.Link></Nav.Item>
                  ))}
                </Nav>

                {filtroCategoria === 'preparaciones' && (
                  <div className="mb-4 d-flex justify-content-center gap-2 animate-fade-in">
                    <Button size="sm" variant={subFiltroPrep === 'todas' ? 'light' : 'outline-light'} onClick={() => setSubFiltroPrep('todas')} className="rounded-pill px-3 fw-bold"><FaList className="me-2"/>Todas</Button>
                    <Button size="sm" variant={subFiltroPrep === 'calientes' ? 'warning' : 'outline-warning'} onClick={() => setSubFiltroPrep('calientes')} className="rounded-pill px-3 fw-bold"><FaMugHot className="me-2"/>Calientes</Button>
                    <Button size="sm" variant={subFiltroPrep === 'frias' ? 'info' : 'outline-info'} onClick={() => setSubFiltroPrep('frias')} className="rounded-pill px-3 fw-bold"><FaSnowflake className="me-2"/>Frías</Button>
                    <Button size="sm" variant={subFiltroPrep === 'filtrados' ? 'secondary' : 'outline-secondary'} onClick={() => setSubFiltroPrep('filtrados')} className="rounded-pill px-3 fw-bold"><FaFilter className="me-2"/>Filtrados</Button>
                  </div>
                )}
                
                <Table hover responsive className="align-middle table-dark-custom">
                  <thead><tr><th style={{paddingLeft:'1.5rem'}}>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th><th className="text-end" style={{paddingRight:'1.5rem'}}>Acción</th></tr></thead>
                  <tbody>
                    {productosFiltrados.map(p => (
                      <tr key={p.id_producto}>
                        <td style={{paddingLeft: '1.5rem'}}><div className="d-flex align-items-center gap-3"><div className="product-image-premium">{p.imagen && <img src={p.imagen} alt={p.nombre} />}</div><div><div className="product-title-premium">{p.nombre}</div><div className="product-category-premium">{p.categoria?.nombre}</div></div></div></td>
                        <td className="fw-bold text-coffee-accent">${p.formatos?.[0]?.precio?.toLocaleString()}</td>
                        <td>{p.formatos?.length > 0 && p.formatos[0].stock > 9000 ? <FaInfinity color="var(--coffee-accent)"/> : p.formatos?.reduce((acc,f)=>acc+f.stock,0)}</td>
                        <td><Badge bg={p.estado === 'Publicado' ? 'success' : 'secondary'}>{p.estado}</Badge></td>
                        <td className="text-end" style={{paddingRight: '1.5rem'}}><Button size="sm" className="me-2 btn-action-pill" onClick={()=>irAEditar(p)}><FaEdit /></Button><Button size="sm" className="btn-action-pill delete" onClick={()=>eliminarProducto(p.id_producto)}><FaTrash /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : (
             <Card className="card-admin-dark border-0"><Card.Body className="p-4"><Form onSubmit={guardarProducto}><h5 className="text-coffee-accent mb-4">{modoEdicion?'Editar':'Nuevo'} Producto</h5>{/* ... FORMULARIO COMPLETO ... */}<Button variant="outline-light" onClick={()=>setVista('lista')}>Cancelar</Button><Button type="submit" className="ms-2 btn-coffee-pill">Guardar</Button></Form></Card.Body></Card>
          )}
        </Tab>

        {/* TAB VENTAS (ACTUALIZADO) */}
        <Tab eventKey="ventas" title="Ventas">
          <Card className="card-admin-dark border-0">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 text-coffee-title" style={{ color: 'var(--coffee-accent)' }}>Solicitudes de Compra</h5>
              </div>

              {/* FILTROS DE VENTAS */}
              <Nav variant="pills" className="mb-4 nav-pills-coffee">
                <Nav.Item>
                  <Nav.Link 
                    eventKey="pendientes" 
                    onClick={() => setFiltroVentas('pendientes')} 
                    active={filtroVentas === 'pendientes'}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaClock /> Pendientes <Badge bg="danger" pill>{ventas.filter(v => v.estado === 'Por Confirmar').length}</Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="aprobados" 
                    onClick={() => setFiltroVentas('aprobados')} 
                    active={filtroVentas === 'aprobados'}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaCheckCircle /> Aprobados
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="rechazados" 
                    onClick={() => setFiltroVentas('rechazados')} 
                    active={filtroVentas === 'rechazados'}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaBan /> Rechazados
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="todos" 
                    onClick={() => setFiltroVentas('todos')} 
                    active={filtroVentas === 'todos'}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaHistory /> Todos
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Table hover responsive className="align-middle table-dark-custom">
                <thead>
                  <tr>
                    <th style={{paddingLeft:'1.5rem'}}>ID / Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Comprobante</th>
                    <th>Estado</th>
                    <th className="text-end" style={{paddingRight:'1.5rem'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map(v => (
                    <tr key={v.id_orden}>
                      <td style={{paddingLeft: '1.5rem'}}>
                        <div className="fw-bold">#{v.id_orden}</div>
                        <small className="text-white-50">{new Date(v.fecha).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="fw-bold text-white">{v.nombre} {v.apellido}</div>
                        <div className="small text-white-50">{v.email}</div>
                      </td>
                      <td className="fw-bold text-success">${v.total.toLocaleString()}</td>
                      <td>
                        {v.comprobante ? (
                          <Button size="sm" variant="outline-info" onClick={() => verComprobante(v.comprobante)} className="rounded-pill">
                            <FaEye className="me-1"/> Ver Foto
                          </Button>
                        ) : <span className="text-muted small">No adjunto</span>}
                      </td>
                      <td>
                        <Badge bg={v.estado === 'Completado' ? 'success' : v.estado === 'Rechazado' ? 'danger' : 'warning'} text="dark" className="px-3 py-2">
                          {v.estado === 'Por Confirmar' ? 'Pendiente' : v.estado}
                        </Badge>
                      </td>
                      <td className="text-end" style={{paddingRight: '1.5rem'}}>
                        {v.estado === 'Por Confirmar' && (
                          <div className="d-flex justify-content-end gap-2">
                            <Button variant="success" size="sm" onClick={() => cambiarEstadoOrden(v.id_orden, 'Completado')} title="Aprobar Venta"><FaCheck /></Button>
                            <Button variant="danger" size="sm" onClick={() => cambiarEstadoOrden(v.id_orden, 'Rechazado')} title="Rechazar Venta"><FaTimes /></Button>
                          </div>
                        )}
                        {v.estado === 'Completado' && <span className="text-success small fw-bold"><FaCheck /> Aprobado</span>}
                        {v.estado === 'Rechazado' && <span className="text-danger small fw-bold"><FaTimes /> Rechazado</span>}
                      </td>
                    </tr>
                  ))}
                  {ventasFiltradas.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-muted">No hay solicitudes en esta sección</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="mensajes" title="Mensajes"><Card className="card-admin-dark border-0"><Card.Body><h5 className="text-coffee-title">Mensajes</h5><p className="text-center py-5 text-muted">No hay mensajes</p></Card.Body></Card></Tab>
      </Tabs>

      {/* MODAL CATEGORÍA */}
      <Modal show={showCatModal} onHide={() => setShowCatModal(false)} centered contentClassName="card-admin-dark border-0">
        <Modal.Header closeButton closeVariant="white" className="border-secondary"><Modal.Title className="text-coffee-accent">Nueva Categoría</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label className="text-white-50">Nombre</Form.Label><Form.Control value={newCatData.nombre} onChange={(e) => setNewCatData({nombre: e.target.value})} placeholder="Ej: Té" /></Form.Group>
          <Button className="btn-coffee-pill w-100 border-0" onClick={guardarCategoria}>Crear</Button>
        </Modal.Body>
      </Modal>

      {/* MODAL COMPROBANTE */}
      <Modal show={showComprobante} onHide={() => setShowComprobante(false)} size="lg" centered contentClassName="bg-dark text-white border-0">
        <Modal.Header closeButton closeVariant="white" className="border-secondary"><Modal.Title>Comprobante de Pago</Modal.Title></Modal.Header>
        <Modal.Body className="text-center p-0 bg-secondary"><Image src={imgComprobante} fluid style={{maxHeight: '80vh'}} /></Modal.Body>
        <Modal.Footer className="border-secondary"><Button variant="secondary" onClick={() => setShowComprobante(false)}>Cerrar</Button></Modal.Footer>
      </Modal>

    </Container>
  );
}

export default Admin;