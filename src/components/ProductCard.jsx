import { Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../ProductCards.css';

function ProductCard({ producto }) {
  const { addToCart } = useCart();

  const formatos = producto.formatos || [];
  const precios = formatos.map(f => f.precio);
  const precioMinimo = precios.length > 0 ? Math.min(...precios) : 0;
  const stockTotal = formatos.reduce((acc, f) => acc + f.stock, 0);
  const tieneVariaciones = formatos.length > 1;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (formatos.length === 1) {
      addToCart(producto, formatos[0], 1);
      alert(`Añadido: ${producto.nombre}`);
    }
  };

  return (
    <Link to={`/producto/${producto.id_producto}`} className="text-decoration-none h-100 d-block">
      <div className="card-aesthetic">
        
        <div className="image-container-square">
          {/* SI HAY IMAGEN, LA MUESTRA. SI NO, MUESTRA UN CUADRO CON TEXTO */}
          {producto.imagen ? (
            <img 
                src={producto.imagen} 
                alt={producto.nombre} 
                loading="lazy" 
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted bg-light">
              <small className="fw-bold text-uppercase text-center px-2">Sin Imagen</small>
            </div>
          )}

          {stockTotal === 0 && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(255,255,255,0.7)'}}>
              <Badge bg="secondary" className="px-3 py-2 text-uppercase">Agotado</Badge>
            </div>
          )}
        </div>

        <div className="card-body-aesthetic">
          <div>
            <div className="category-tag">
              {producto.categoria?.nombre}
            </div>
            <h3 className="product-title">
              {producto.nombre}
            </h3>
            <div className="price-tag">
              {tieneVariaciones && <span className="fw-normal text-muted small me-1">Desde</span>}
              ${precioMinimo.toLocaleString()}
            </div>
          </div>

          <div className="mt-2">
            {tieneVariaciones ? (
              <button className="btn-aesthetic outline">
                Ver Opciones
              </button>
            ) : (
              <button 
                className="btn-aesthetic"
                onClick={handleQuickAdd}
                disabled={stockTotal === 0}
              >
                {stockTotal === 0 ? 'Sin Stock' : 'Agregar +'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;