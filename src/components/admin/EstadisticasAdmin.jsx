import { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { supabase } from '../../supabase/cliente';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { FaMoneyBillWave, FaShoppingBag, FaChartLine } from 'react-icons/fa';

const EstadisticasAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [ingresos, setIngresos] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [kpis, setKpis] = useState({ ventas_totales: 0, ordenes_totales: 0, ticket_promedio: 0 });

  // Colores para el gráfico de torta
  const COLORES_PIE = ['#5c3d2e', '#8b4949', '#c4a484', '#6f4e37', '#a08468'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // 1. Llamar RPC: Ingresos Mensuales
      const { data: dataIngresos } = await supabase.rpc('get_ingresos_mensuales');
      
      // 2. Llamar RPC: Top Productos
      const { data: dataTop } = await supabase.rpc('get_top_productos');
      
      // 3. Llamar RPC: KPIs Generales
      const { data: dataKpis } = await supabase.rpc('get_kpis_generales');

      if (dataIngresos) setIngresos(dataIngresos);
      if (dataTop) setTopProductos(dataTop);
      if (dataKpis) setKpis(dataKpis);

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

      <Row>
        {/* --- GRÁFICO 1: INGRESOS MENSUALES --- */}
        <Col lg={8} className="mb-4">
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

        {/* --- GRÁFICO 2: TOP PRODUCTOS --- */}
        <Col lg={4} className="mb-4">
          <Card className="card-admin-dark border-0 h-100">
            <Card.Body>
              <h5 className="text-white mb-4">Top 5 Productos</h5>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={topProductos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="cantidad"
                    >
                      {topProductos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#2c2c2c', border: 'none', color: '#fff'}} />
                    <Legend />
                  </PieChart>
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