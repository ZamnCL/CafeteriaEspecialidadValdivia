import { Button, Badge } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { FaClock, FaTrash } from 'react-icons/fa';

function CartItem({ item }) {
  const { producto, formato, cantidad, reserva } = item;
  const { removeFromCart, updateQuantity } = useCart();

  const handleIncrement = () => updateQuantity(producto.id_producto, formato.id_formato, cantidad + 1, reserva);
  const handleDecrement = () => { if (cantidad > 1) updateQuantity(producto.id_producto, formato.id_formato, cantidad - 1, reserva); };
  const handleRemove = () => removeFromCart(producto.id_producto, formato.id_formato, reserva);

  return (
    <div className="d-flex align-items-center justify-content-between border-bottom py-3">
      <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {producto.imagen ? <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{fontSize:'0.6rem'}}>Sin img</span>}
        </div>
        
        <div>
          <h6 className="mb-0 fw-bold">{producto.nombre}</h6>
          <div className="d-flex flex-column">
            <small className="text-muted">{formato.nombre} - ${formato.precio.toLocaleString()}</small>
            {reserva && (
              <Badge bg="warning" text="dark" className="mt-1 d-inline-flex align-items-center" style={{width: 'fit-content'}}>
                <FaClock size={10} className="me-1"/>
                {reserva.date.split('-').slice(1).reverse().join('/')} - {reserva.time}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <Button variant="outline-secondary" size="sm" onClick={handleDecrement}>-</Button>
        <span style={{ width: '20px', textAlign: 'center' }}>{cantidad}</span>
        <Button variant="outline-secondary" size="sm" onClick={handleIncrement}>+</Button>
      </div>

      <div className="text-end">
        <div className="fw-bold mb-1">${(formato.precio * cantidad).toLocaleString()}</div>
        <Button variant="link" className="text-danger p-0 text-decoration-none" size="sm" onClick={handleRemove}>
          <FaTrash />
        </Button>
      </div>
    </div>
  );
}

export default CartItem;