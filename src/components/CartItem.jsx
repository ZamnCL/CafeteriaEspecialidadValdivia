import { Button, Badge } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { FaClock, FaTrash } from 'react-icons/fa';

function CartItem({ item }) {
  const { producto, formato, cantidad, reserva } = item;
  const { removeFromCart, updateQuantity } = useCart();

  const handleIncrement = () => updateQuantity(producto.id_producto, formato.id_formato, cantidad + 1, reserva);
  
  // --- LÓGICA CORREGIDA: ELIMINAR SI ES 1 ---
  const handleDecrement = () => { 
    if (cantidad > 1) {
        updateQuantity(producto.id_producto, formato.id_formato, cantidad - 1, reserva);
    } else {
        // Si la cantidad es 1 y presiona menos, se elimina
        handleRemove();
    }
  };
  
  const handleRemove = () => removeFromCart(producto.id_producto, formato.id_formato, reserva);

  return (
    // align-items-center para centrar verticalmente todo
    <div className="d-flex align-items-center justify-content-between py-4 px-3 border-bottom">
      
      {/* Lado Izquierdo: Imagen e Info */}
      <div className="d-flex align-items-center" style={{ gap: '1.5rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8f9fa', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{fontSize:'0.7rem', color: '#999'}}>Sin img</span>
          )}
        </div>
        
        <div>
          <h6 className="mb-1 fw-bold text-coffee-dark" style={{fontSize: '1.1rem'}}>{producto.nombre}</h6>
          <div className="d-flex flex-column">
            {/* PRECIO UNITARIO CON PUNTOS */}
            <small className="text-muted mb-1">
              {formato.nombre} — ${formato.precio.toLocaleString('es-CL')} c/u
            </small>
            {reserva && (
              <Badge bg="warning" text="dark" className="d-inline-flex align-items-center border border-light shadow-sm" style={{width: 'fit-content', fontSize: '0.7rem'}}>
                <FaClock size={10} className="me-1"/>
                Retiro: {reserva.time}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Centro: Selector de Cantidad (Estilo Cuadrado Limpio) */}
      <div className="d-flex align-items-center">
        <div className="d-flex align-items-center border rounded" style={{backgroundColor: '#fff'}}>
          <Button 
            variant="link" 
            className="text-dark text-decoration-none px-3 fw-bold" 
            onClick={handleDecrement}
            style={{fontSize: '1.2rem', lineHeight: '1'}}
          >
            -
          </Button>
          <span className="fw-bold text-dark px-2" style={{minWidth: '30px', textAlign: 'center'}}>
            {cantidad}
          </span>
          <Button 
            variant="link" 
            className="text-dark text-decoration-none px-3 fw-bold" 
            onClick={handleIncrement}
            style={{fontSize: '1.2rem', lineHeight: '1'}}
          >
            +
          </Button>
        </div>
      </div>

      {/* Lado Derecho: Precio Total y Eliminar */}
      <div className="text-end" style={{minWidth: '100px'}}>
        {/* PRECIO TOTAL ITEM CON PUNTOS */}
        <div className="fw-bold mb-2 fs-5 text-coffee-accent">
          ${(formato.precio * cantidad).toLocaleString('es-CL')}
        </div>
        <Button 
            variant="outline-danger" 
            size="sm" 
            className="border-0 p-1" 
            onClick={handleRemove}
            title="Eliminar producto"
        >
          <FaTrash size={16}/>
        </Button>
      </div>

    </div>
  );
}

export default CartItem;