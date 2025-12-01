import { Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../ProductCards.css';

function ProductCard({ producto, isReserva, onShowToast }) {
  const { addToCart } = useCart();

  const formatos = producto.formatos || [];
  const precios = formatos.map(f => f.precio);
  const precioMinimo = precios.length > 0 ? Math.min(...precios) : 0;
  
  // Calcular stock total real
  const stockTotal = formatos.reduce((acc, f) => acc + f.stock, 0);
  const tieneVariaciones = formatos.length > 1;
  
  // Determinar si está agotado (solo si no es reserva)
  const estaAgotado = !isReserva && stockTotal <= 0;

  const handleQuickAdd = (e) => {
    // Si es reserva o tiene variaciones, dejamos que el Link nos lleve al detalle
    if (isReserva || tieneVariaciones || estaAgotado) return;

    // Si es producto simple con stock, agregamos directo
    e.preventDefault();
    
    if (formatos.length === 1) {
      const f = formatos[0];
      addToCart(producto, f.id_formato, f.nombre, f.precio, 1);
      if (onShowToast) onShowToast(producto.nombre);
    }
  };

  // Lógica del Texto del Botón (Estilo Original)
  let buttonText = "Agregar al Carrito";
  if (estaAgotado) buttonText = "Agotado";
  if (tieneVariaciones) buttonText = "Ver Opciones";
  if (isReserva) buttonText = "Reservar";

  return (
    <Link to={`/producto/${producto.id_producto}`} className="text-decoration-none h-100 d-block">
      <div className="card-aesthetic h-100">
        
        <div className="image-container-square position-relative">
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} loading="lazy" />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted bg-light">
              <small className="fw-bold text-uppercase text-center px-2">Sin Imagen</small>
            </div>
          )}

          {/* RESTAURADO: Overlay de Agotado al centro (Diseño Original) */}
          {estaAgotado && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{background: 'rgba(255,255,255,0.7)'}}>
              <Badge bg="secondary" className="px-3 py-2 text-uppercase shadow-sm">Agotado</Badge>
            </div>
          )}
        </div>

        <div className="card-body-aesthetic">
          <div>
            {/* RESTAURADO: Categoría como texto simple, no badge */}
            <div className="category-tag">{producto.categoria?.nombre}</div>
            <h3 className="product-title">{producto.nombre}</h3>
            <div className="price-tag">
              {tieneVariaciones && <span className="fw-normal text-muted small me-1">Desde</span>}
              ${precioMinimo.toLocaleString('es-CL')}
            </div>
          </div>

          <div className="mt-auto w-100">
            {/* RESTAURADO: Botón único "Aesthetic" */}
            <button 
              className={`btn-aesthetic ${tieneVariaciones ? 'outline' : ''}`}
              onClick={tieneVariaciones ? undefined : handleQuickAdd}
              disabled={estaAgotado}
              style={{ opacity: estaAgotado ? 0.6 : 1, cursor: estaAgotado ? 'not-allowed' : 'pointer' }}
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