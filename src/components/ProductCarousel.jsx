import { useState } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function ProductCarousel({ title, products }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsVisible = 3;

  if (!products || products.length === 0) return null;

  // --- LÓGICA CIRCULAR INFINITA ---
  const next = () => {
    // Avanzamos 1, y si nos pasamos del largo, el módulo (%) nos devuelve al principio matemáticamente
    setStartIndex((prev) => (prev + 1) % products.length);
  };

  const prev = () => {
    // Retrocedemos 1, sumamos el largo para evitar negativos, y aplicamos módulo
    setStartIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Generamos la lista visible calculando los índices de forma circular
  const getVisibleProducts = () => {
    const visible = [];
    for (let i = 0; i < itemsVisible; i++) {
      // El operador % asegura que si el índice supera el último elemento, vuelva al 0
      const index = (startIndex + i) % products.length;
      visible.push(products[index]);
    }
    return visible;
  };

  const visibleProducts = getVisibleProducts();

  // Si hay menos productos que los espacios visibles, centramos el contenido y ocultamos flechas
  const showControls = products.length > itemsVisible;

  return (
    <div className="my-5 position-relative">
      <h3 className="text-center fw-bold mb-4 text-uppercase" style={{ letterSpacing: '2px' }}>
        {title}
      </h3>

      <div className="position-relative px-4">
        <Row className={`g-4 ${!showControls ? 'justify-content-center' : ''}`}>
          {visibleProducts.map((prod, index) => (
            // Usamos index en la key para evitar conflictos si un mismo producto aparece 2 veces (ej: en arrays pequeños que se repiten)
            <Col key={`${prod.id_producto}-${index}`} md={4}>
              <div className="animate-fade-in">
                <ProductCard producto={prod} />
              </div>
            </Col>
          ))}
        </Row>

        {/* Controles Flotantes - Solo se muestran si hay suficientes productos para rotar */}
        {showControls && (
          <>
            <Button 
              variant="light" 
              className="position-absolute top-50 start-0 translate-middle-y shadow-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px', zIndex: 10 }}
              onClick={prev}
            >
              <FaChevronLeft />
            </Button>

            <Button 
              variant="light" 
              className="position-absolute top-50 end-0 translate-middle-y shadow-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px', zIndex: 10 }}
              onClick={next}
            >
              <FaChevronRight />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductCarousel;