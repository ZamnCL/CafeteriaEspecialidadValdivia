import { Container, Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { Link } from 'react-router-dom';
import { FaShippingFast, FaLock } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/cliente';

function Cart() {
  const { cart, getCartTotal, clearCart, updateQuantity, removeFromCart, addToCart } = useCart();
  const total = getCartTotal();
  const [productosRecomendados, setProductosRecomendados] = useState([]);
  const [loadingRecomendados, setLoadingRecomendados] = useState(false);

  const envioGratisMinimo = 40000;
  const faltaParaEnvioGratis = Math.max(0, envioGratisMinimo - total);
  const porcentajeEnvioGratis = Math.min(100, (total / envioGratisMinimo) * 100);

  useEffect(() => {
    const cargarRecomendados = async () => {
      if (cart.length === 0) return;

      setLoadingRecomendados(true);
      try {
        const categoriasEnCarrito = [...new Set(cart.map(item => item.producto?.id_categoria).filter(Boolean))];
        const productosEnCarrito = cart.map(item => item.id_producto);

        let query = supabase
          .from('productos')
          .select(`
            *,
            categoria:categoria!productos_id_categoria_fkey (nombre),
            formatos:formatos!formatos_id_producto_fkey (*)
          `)
          .eq('activo', true)
          .not('id_producto', 'in', `(${productosEnCarrito.join(',')})`)
          .limit(4);

        if (categoriasEnCarrito.length > 0) {
          query = query.in('id_categoria', categoriasEnCarrito);
        }

        const { data, error } = await query;

        if (error) throw error;
        setProductosRecomendados(data || []);
      } catch (error) {
        console.error('Error cargando recomendados:', error);
      } finally {
        setLoadingRecomendados(false);
      }
    };

    cargarRecomendados();
  }, [cart]);

  const agregarRecomendado = (producto) => {
    if (!producto.formatos || producto.formatos.length === 0) return;

    const formatoDefault = producto.formatos[0];
    addToCart(producto.id_producto, formatoDefault.id_formato, 1);
  };

  if (cart.length === 0) {
    return (
      <Container className="mt-5 text-center" style={{minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div className="mb-4">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h2 className="mb-3 fw-bold" style={{color: '#2c2c2c', fontSize: '2rem'}}>Tu carrito está vacío</h2>
        <p className="text-muted mb-5" style={{fontSize: '1.1rem'}}>Descubre nuestros cafés especiales y comienza tu experiencia</p>
        <Link to="/catalogo">
          <Button
            variant="dark"
            size="lg"
            className="px-5 py-3 fw-bold"
            style={{
              backgroundColor: '#2c2c2c',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
          >
            EXPLORAR PRODUCTOS
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5" style={{maxWidth: '1400px'}}>
      <div className="mb-5">
        <h1 className="mb-2 fw-bold" style={{color: '#2c2c2c', fontSize: '2.5rem', letterSpacing: '-0.5px'}}>
          Carrito de Compras
        </h1>
        <p className="text-muted" style={{fontSize: '1rem'}}>
          {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          {faltaParaEnvioGratis > 0 && (
            <Card className="mb-4 border-0 shadow-sm" style={{borderRadius: '12px', overflow: 'hidden'}}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <FaShippingFast size={24} className="text-success me-3" />
                  <div className="flex-grow-1">
                    <p className="mb-1 fw-bold" style={{color: '#2c2c2c', fontSize: '0.95rem'}}>
                      ¡Te faltan ${faltaParaEnvioGratis.toLocaleString('es-CL')} para envío gratis!
                    </p>
                    <ProgressBar
                      now={porcentajeEnvioGratis}
                      style={{height: '8px', borderRadius: '10px'}}
                      className="bg-light"
                    >
                      <ProgressBar
                        now={porcentajeEnvioGratis}
                        style={{backgroundColor: '#4CAF50', borderRadius: '10px'}}
                      />
                    </ProgressBar>
                  </div>
                </div>
                <p className="text-muted mb-0 small">
                  Envío gratis en compras sobre ${envioGratisMinimo.toLocaleString('es-CL')}
                </p>
              </Card.Body>
            </Card>
          )}

          {porcentajeEnvioGratis >= 100 && (
            <Card className="mb-4 border-0 shadow-sm" style={{borderRadius: '12px', backgroundColor: '#f0f9f4'}}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <FaShippingFast size={24} className="text-success me-3" />
                  <div>
                    <p className="mb-0 fw-bold text-success" style={{fontSize: '1rem'}}>
                      ¡Felicitaciones! Tienes envío gratis 🎉
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          <Card className="border-0 shadow-sm mb-4" style={{borderRadius: '12px'}}>
            <Card.Body className="p-0">
              {cart.map((item, idx) => (
                <div
                  key={`${item.id_producto}-${item.id_formato}-${idx}`}
                  style={{
                    borderBottom: idx < cart.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <CartItem
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center mb-5">
            <Link to="/catalogo" className="text-decoration-none">
              <Button
                variant="link"
                className="text-dark p-0 fw-semibold"
                style={{fontSize: '0.95rem'}}
              >
                ← Seguir comprando
              </Button>
            </Link>
            <Button
              variant="link"
              onClick={clearCart}
              className="text-danger p-0 fw-semibold"
              style={{fontSize: '0.95rem'}}
            >
              Vaciar carrito
            </Button>
          </div>

          {productosRecomendados.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-4 fw-bold" style={{color: '#2c2c2c', fontSize: '1.5rem'}}>
                También te puede interesar
              </h3>
              <Row className="g-3">
                {productosRecomendados.map((producto) => (
                  <Col key={producto.id_producto} xs={6} md={3}>
                    <Card
                      className="border-0 shadow-sm h-100"
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <Link to={`/producto/${producto.id_producto}`} className="text-decoration-none">
                        <div
                          style={{
                            height: '180px',
                            overflow: 'hidden',
                            backgroundColor: '#f8f9fa'
                          }}
                        >
                          {producto.imagen ? (
                            <img
                              src={producto.imagen}
                              alt={producto.nombre}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            </div>
                          )}
                        </div>
                      </Link>
                      <Card.Body className="p-3">
                        <Link to={`/producto/${producto.id_producto}`} className="text-decoration-none">
                          <h6
                            className="mb-2 fw-bold"
                            style={{
                              color: '#2c2c2c',
                              fontSize: '0.9rem',
                              lineHeight: '1.3',
                              height: '2.6em',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {producto.nombre}
                          </h6>
                        </Link>
                        {producto.formatos && producto.formatos.length > 0 && (
                          <p className="mb-2 fw-bold" style={{color: '#2c2c2c', fontSize: '1rem'}}>
                            ${producto.formatos[0].precio.toLocaleString('es-CL')}
                          </p>
                        )}
                        <Button
                          size="sm"
                          className="w-100 border-0"
                          style={{
                            backgroundColor: '#2c2c2c',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            padding: '8px',
                            fontWeight: '600'
                          }}
                          onClick={() => agregarRecomendado(producto)}
                        >
                          Agregar
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Col>

        <Col lg={4}>
          <div className="sticky-top" style={{top: '100px'}}>
            <Card className="border-0 shadow-lg" style={{borderRadius: '16px', overflow: 'hidden'}}>
              <Card.Body className="p-4">
                <h4 className="mb-4 fw-bold" style={{color: '#2c2c2c', fontSize: '1.5rem'}}>
                  Resumen del Pedido
                </h4>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-3">
                    <span style={{color: '#666', fontSize: '1rem'}}>Subtotal</span>
                    <span className="fw-semibold" style={{color: '#2c2c2c', fontSize: '1rem'}}>
                      ${total.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span style={{color: '#666', fontSize: '1rem'}}>Envío</span>
                    <span style={{color: '#666', fontSize: '0.9rem', fontStyle: 'italic'}}>
                      {porcentajeEnvioGratis >= 100 ? 'Gratis' : 'A calcular'}
                    </span>
                  </div>
                </div>

                <div
                  className="d-flex justify-content-between align-items-center py-3 mb-4"
                  style={{borderTop: '2px solid #f0f0f0', borderBottom: '2px solid #f0f0f0'}}
                >
                  <span className="fw-bold text-uppercase" style={{color: '#2c2c2c', fontSize: '1.1rem', letterSpacing: '1px'}}>
                    Total
                  </span>
                  <span className="fw-bold" style={{color: '#2c2c2c', fontSize: '2rem'}}>
                    ${total.toLocaleString('es-CL')}
                  </span>
                </div>

                <Link to="/checkout" className="text-decoration-none w-100 d-block mb-3">
                  <Button
                    className="w-100 py-3 fw-bold border-0"
                    style={{
                      backgroundColor: '#2c2c2c',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      letterSpacing: '0.5px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    FINALIZAR COMPRA
                  </Button>
                </Link>

                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center text-muted small">
                    <FaLock className="me-2" size={12} />
                    <span style={{fontSize: '0.85rem'}}>Pago seguro con Mercado Pago</span>
                  </div>
                </div>

              </Card.Body>
            </Card>

            <Card className="border-0 mt-4" style={{borderRadius: '12px', backgroundColor: '#f8f9fa'}}>
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3" style={{color: '#2c2c2c', fontSize: '0.95rem'}}>
                  BENEFICIOS DE COMPRAR CON NOSOTROS
                </h6>
                <ul className="list-unstyled mb-0" style={{fontSize: '0.85rem', color: '#666'}}>
                  <li className="mb-2">✓ Envío gratis sobre $40.000</li>
                  <li className="mb-2">✓ Hasta 3 cuotas sin interés</li>
                  <li className="mb-2">✓ Café fresco y de especialidad</li>
                  <li className="mb-0">✓ Atención personalizada</li>
                </ul>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;