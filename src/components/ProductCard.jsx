import { Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../ProductCards.css';

function ProductCard({ producto, isReserva, onShowToast }) {
  const { addToCart } = useCart();

  const formatos = producto.formatos || [];
  const precios = formatos.map(f => f.precio);
  const precioMinimo = precios.length > 0 ? Math.min(...precios) : 0;
  const stockTotal = formatos.reduce((acc, f) => acc + f.stock, 0);
  const tieneVariaciones = formatos.length > 1;

  // --- MANEJADOR DEL BOTÓN ---
  const handleQuickAdd = (e) => {
    // Si es RESERVA, no hacemos preventDefault. 
    // Dejamos que el click burbujee al <Link> y nos lleve al detalle.
    if (isReserva) return;

    // Si es PRODUCTO FÍSICO, detenemos la navegación y agregamos al carro.
    e.preventDefault();
    
    if (formatos.length === 1) {
      const f = formatos[0];
      // CORRECCIÓN: Pasamos los argumentos desglosados correctamente
      addToCart(producto, f.id_formato, f.nombre, f.precio, 1);
      
      // Ejecutar la notificación visual del padre
      if (onShowToast) onShowToast(producto.nombre);
    }
  };

  // Texto del botón según el caso
  let buttonText = "Agregar al Carrito";
  if (stockTotal === 0 && !isReserva) buttonText = "Sin Stock";
  if (tieneVariaciones) buttonText = "Ver Opciones";
  if (isReserva) buttonText = "Reservar";

  return (
    <Link to={`/producto/${producto.id_producto}`} className="text-decoration-none h-100 d-block">
      <div className="card-aesthetic">
        
        <div className="image-container-square">
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} loading="lazy" />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted bg-light">
              <small className="fw-bold text-uppercase text-center px-2">Sin Imagen</small>
            </div>
          )}

          {stockTotal === 0 && !isReserva && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(255,255,255,0.7)'}}>
              <Badge bg="secondary" className="px-3 py-2 text-uppercase">Agotado</Badge>
            </div>
          )}
        </div>

        <div className="card-body-aesthetic">
          <div>
            <div className="category-tag">{producto.categoria?.nombre}</div>
            <h3 className="product-title">{producto.nombre}</h3>
            <div className="price-tag">
              {tieneVariaciones && <span className="fw-normal text-muted small me-1">Desde</span>}
              ${precioMinimo.toLocaleString()}
            </div>
          </div>

          <div className="mt-2">
            <button 
              className={`btn-aesthetic ${tieneVariaciones ? 'outline' : ''}`}
              onClick={tieneVariaciones ? undefined : handleQuickAdd}
              disabled={stockTotal === 0 && !isReserva}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;