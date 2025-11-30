import { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner, Table, ProgressBar } from 'react-bootstrap';
import { supabase } from '../../supabase/cliente';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { FaMoneyBillWave, FaShoppingBag, FaChartLine, FaMugHot, FaBoxOpen } from 'react-icons/fa';

const EstadisticasAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [ingresos, setIngresos] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [topPreparaciones, setTopPreparaciones] = useState([]);
  const [kpis, setKpis] = useState({ ventas_totales: 0, ordenes_totales: 0, ticket_promedio: 0 });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // 1. Ingresos Mensuales (Gráfico de barras se mantiene)
      const { data: dataIngresos } = await supabase.rpc('get_ingresos_mensuales');
      
      // 2. KPIs Generales
      const { data: dataKpis } = await supabase.rpc('get_kpis_generales');

      // 3. Top Productos Físicos (NUEVA FUNCION SQL)
      const { data: dataTopProds } = await supabase.rpc('get_top_productos_fisicos');

      // 4. Top Preparaciones (NUEVA FUNCION SQL)
      const { data: dataTopPrep } = await supabase.rpc('get_top_preparaciones');

      if (dataIngresos) setIngresos(dataIngresos);
      if (dataKpis) setKpis(dataKpis);
      if (dataTopProds) setTopProductos(dataTopProds);
      if (dataTopPrep) setTopPreparaciones(dataTopPrep);

    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="warning"/></div>;

  return (
    <div className="animate-fade-in">
      <h4 className="text-coffee-title mb-4">Dashboard de Negocio</h4>

      {/* --- TARJETAS DE KPIS --- */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle p-3 me-3" style={{background: 'rgba(92, 61, 46, 0.3)'}}>
                <FaMoneyBillWave size={24} className="text-warning"/>
              </div>
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Ventas Totales</small>
                <h3 className="mb-0 text-white">${kpis.ventas_totales.toLocaleString()}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle p-3 me-3" style={{background: 'rgba(92, 61, 46, 0.3)'}}>
                <FaShoppingBag size={24} className="text-info"/>
              </div>
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Pedidos Completados</small>
                <h3 className="mb-0 text-white">{kpis.ordenes_totales}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle p-3 me-3" style={{background: 'rgba(92, 61, 46, 0.3)'}}>
                <FaChartLine size={24} className="text-success"/>
              </div>
              <div>
                <small className="text-white-50 text-uppercase fw-bold">Ticket Promedio</small>
                <h3 className="mb-0 text-white">${kpis.ticket_promedio.toLocaleString()}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* --- LISTA 1: PRODUCTOS FÍSICOS MÁS VENDIDOS --- */}
        <Col lg={6}>
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FaBoxOpen className="text-coffee-accent me-2" />
                <h5 className="text-white mb-0">Top Productos (Tienda)</h5>
              </div>
              
              {topProductos.length === 0 ? (
                <p className="text-muted text-center py-3">Sin datos aún.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {topProductos.map((prod, idx) => (
                    <div key={idx}>
                      <div className="d-flex justify-content-between text-white-50 mb-1 small">
                        <span>{prod.nombre}</span>
                        <span className="fw-bold text-white">{prod.cantidad} un.</span>
                      </div>
                      <ProgressBar 
                        now={(prod.cantidad / topProductos[0].cantidad) * 100} 
                        variant="warning" 
                        style={{height: '6px', backgroundColor: 'rgba(255,255,255,0.1)'}} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* --- LISTA 2: PREPARACIONES MÁS VENDIDAS --- */}
        <Col lg={6}>
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FaMugHot className="text-coffee-accent me-2" />
                <h5 className="text-white mb-0">Top Preparaciones (Barra)</h5>
              </div>

              {topPreparaciones.length === 0 ? (
                <p className="text-muted text-center py-3">Sin datos aún.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {topPreparaciones.map((prep, idx) => (
                    <div key={idx}>
                      <div className="d-flex justify-content-between text-white-50 mb-1 small">
                        <span>{prep.nombre}</span>
                        <span className="fw-bold text-white">{prep.cantidad} un.</span>
                      </div>
                      <ProgressBar 
                        now={(prep.cantidad / topPreparaciones[0].cantidad) * 100} 
                        variant="info" 
                        style={{height: '6px', backgroundColor: 'rgba(255,255,255,0.1)'}} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- GRÁFICO DE BARRAS (INGRESOS) --- */}
      <Row className="mt-4">
        <Col lg={12}>
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body>
              <h5 className="text-white mb-4">Ingresos Mensuales</h5>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={ingresos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                    <XAxis dataKey="mes" stroke="#ccc" tick={{fontSize: 12}} />
                    <YAxis stroke="#ccc" tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#2c2c2c', border: 'none', color: '#fff'}}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Venta']}
                    />
                    <Bar dataKey="total" fill="#c4a484" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default EstadisticasAdmin;