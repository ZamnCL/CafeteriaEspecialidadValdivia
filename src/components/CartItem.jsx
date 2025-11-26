import { Button } from 'react-bootstrap';
import { useCart } from '../context/CartContext';

function CartItem({ item }) {
  const { producto, formato, cantidad } = item;
  const { addToCart, removeFromCart } = useCart();

  const handleIncrement = () => addToCart(producto, formato, 1);
  const handleDecrement = () => { if (cantidad > 1) addToCart(producto, formato, -1); };
  const handleRemove = () => removeFromCart(producto.id_producto, formato.id_formato);

  return (
    <div className="d-flex align-items-center justify-content-between border-bottom py-3">
      <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
        {/* IMAGEN SEGURA */}
        <div style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {producto.imagen ? (
            <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{fontSize: '0.6rem', color: '#999'}}>Sin img</span>
          )}
        </div>
        
        <div>
          <h6 className="mb-0 text-truncate" style={{maxWidth: '200px'}}>{producto.nombre}</h6>
          <small className="text-muted">
            {formato.nombre} - ${formato.precio.toLocaleString()}
          </small>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <Button variant="outline-secondary" size="sm" onClick={handleDecrement}>-</Button>
        <span style={{ width: '20px', textAlign: 'center' }}>{cantidad}</span>
        <Button variant="outline-secondary" size="sm" onClick={handleIncrement}>+</Button>
      </div>

      <div className="text-end">
        <div className="fw-bold">${(formato.precio * cantidad).toLocaleString()}</div>
        <Button variant="link" className="text-danger p-0 text-decoration-none" size="sm" onClick={handleRemove}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default CartItem;