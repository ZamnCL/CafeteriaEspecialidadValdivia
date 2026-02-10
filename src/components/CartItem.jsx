import { Button, Image } from 'react-bootstrap';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const nombreProducto = item.producto?.nombre || "Producto no disponible";
  const imagenProducto = item.producto?.imagen;
  const nombreFormato = item.formato?.nombre || "N/A";
  const precioUnitario = item.formato?.precio || 0;

  return (
    <div className="d-flex align-items-center p-4 position-relative" style={{transition: 'background-color 0.2s ease'}}>
      <div
        style={{
          width: '120px',
          height: '120px',
          flexShrink: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}
      >
        {imagenProducto ? (
          <Image
            src={imagenProducto}
            alt={nombreProducto}
            className="w-100 h-100 object-fit-cover"
            style={{objectFit: 'cover'}}
          />
        ) : (
          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        )}
      </div>

      <div className="flex-grow-1 ms-4">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1 pe-3">
            <h5 className="mb-1 fw-bold" style={{fontSize: '1.1rem', color: '#2c2c2c', lineHeight: '1.4'}}>
              {nombreProducto}
            </h5>
            <p className="mb-0" style={{fontSize: '0.9rem', color: '#666'}}>
              {nombreFormato}
            </p>
            {item.reserva && (
              <div className="mt-2">
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}
                >
                  📅 {item.reserva.date} - {item.reserva.time}
                </span>
              </div>
            )}
          </div>

          <div className="text-end">
            <div className="fw-bold mb-1" style={{fontSize: '1.3rem', color: '#2c2c2c'}}>
              ${(precioUnitario * item.cantidad).toLocaleString('es-CL')}
            </div>
            <small style={{fontSize: '0.8rem', color: '#999'}}>
              ${precioUnitario.toLocaleString('es-CL')} c/u
            </small>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div
            className="d-flex align-items-center"
            style={{
              border: '1.5px solid #e0e0e0',
              borderRadius: '8px',
              padding: '4px 8px',
              backgroundColor: '#fff'
            }}
          >
            <button
              className="btn btn-link text-dark p-0 text-decoration-none d-flex align-items-center justify-content-center"
              onClick={() => onUpdateQuantity(item.id_producto, item.id_formato, item.cantidad - 1)}
              disabled={item.cantidad <= 1}
              style={{
                width: '32px',
                height: '32px',
                opacity: item.cantidad <= 1 ? 0.3 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              <FaMinus size={12} />
            </button>

            <span
              className="mx-3 fw-bold"
              style={{
                fontSize: '1rem',
                minWidth: '30px',
                textAlign: 'center',
                color: '#2c2c2c'
              }}
            >
              {item.cantidad}
            </span>

            <button
              className="btn btn-link text-dark p-0 text-decoration-none d-flex align-items-center justify-content-center"
              onClick={() => onUpdateQuantity(item.id_producto, item.id_formato, item.cantidad + 1)}
              style={{
                width: '32px',
                height: '32px',
                transition: 'opacity 0.2s ease'
              }}
            >
              <FaPlus size={12} />
            </button>
          </div>

          <Button
            variant="link"
            className="text-danger p-0 text-decoration-none d-flex align-items-center"
            onClick={() => onRemove(item.id_producto, item.id_formato)}
            style={{
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'opacity 0.2s ease'
            }}
          >
            <FaTrash size={14} className="me-2" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;