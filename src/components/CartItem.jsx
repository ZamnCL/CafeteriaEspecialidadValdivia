import { Button, Image, Form } from 'react-bootstrap';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

function CartItem({ item, onUpdateQuantity, onRemove }) {
  // Protección visual: Si el producto no carga, usamos valores por defecto
  const nombreProducto = item.producto?.nombre || "Producto no disponible";
  const imagenProducto = item.producto?.imagen;
  const nombreFormato = item.formato?.nombre || "N/A";
  const precioUnitario = item.formato?.precio || 0;

  return (
    <div className="d-flex align-items-center mb-4 p-3 bg-white rounded shadow-sm position-relative">
        <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
            {imagenProducto ? (
                <Image src={imagenProducto} alt={nombreProducto} className="w-100 h-100 rounded object-fit-cover" />
            ) : (
                <div className="w-100 h-100 bg-light rounded d-flex align-items-center justify-content-center text-muted small text-center">
                    Sin Imagen
                </div>
            )}
        </div>
        
        <div className="flex-grow-1 ms-3">
          <div className="d-flex justify-content-between align-items-start">
              <div>
                  <h5 className="mb-1 cart-item-title" style={{fontSize: '1rem', fontWeight: '700', color: '#2c2c2c'}}>
                    {nombreProducto}
                  </h5>
                  <p className="text-muted mb-1 cart-item-subtitle" style={{fontSize: '0.85rem'}}>
                    {nombreFormato}
                    {item.reserva && <span className="text-warning ms-2 fw-bold" style={{fontSize: '0.75rem'}}>📅 {item.reserva.date} - {item.reserva.time}</span>}
                  </p>
              </div>
              <div className="text-end">
                  <div className="fw-bold text-coffee-dark mb-1">${(precioUnitario * item.cantidad).toLocaleString('es-CL')}</div>
                  <small className="text-muted" style={{fontSize: '0.75rem'}}>${precioUnitario.toLocaleString('es-CL')} c/u</small>
              </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
              <div className="quantity-selector-sm d-flex align-items-center bg-light rounded-pill px-2 py-1" style={{border: '1px solid #eee'}}>
                  <button 
                    className="btn btn-link text-dark p-0 text-decoration-none" 
                    onClick={() => onUpdateQuantity(item.id_producto, item.id_formato, item.cantidad - 1)}
                    disabled={item.cantidad <= 1}
                    style={{width: '24px'}}
                  >
                    <FaMinus size={10} />
                  </button>
                  <span className="mx-2 fw-bold" style={{fontSize: '0.9rem', minWidth: '20px', textAlign: 'center'}}>{item.cantidad}</span>
                  <button 
                    className="btn btn-link text-dark p-0 text-decoration-none" 
                    onClick={() => onUpdateQuantity(item.id_producto, item.id_formato, item.cantidad + 1)}
                    style={{width: '24px'}}
                  >
                    <FaPlus size={10} />
                  </button>
              </div>

              <Button 
                variant="link" 
                className="text-danger p-0 text-decoration-none" 
                size="sm"
                onClick={() => onRemove(item.id_producto, item.id_formato)}
              >
                <FaTrash size={14} />
              </Button>
          </div>
        </div>
    </div>
  );
}

export default CartItem;