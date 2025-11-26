import { useState } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import {  FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Asegúrate de tener react-icons

function ProductCarousel({ title, products }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsVisible = 3;

  // Si no hay suficientes productos para hacer scroll, no mostramos flechas
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + itemsVisible < products.length;

  const next = () => {
    if (canScrollRight) setStartIndex(prev => prev + 1);
  };

  const prev = () => {
    if (canScrollLeft) setStartIndex(prev => prev - 1);
  };

  // Obtenemos el "slice" (rebanada) de productos a mostrar
  const visibleProducts = products.slice(startIndex, startIndex + itemsVisible);

  if (!products || products.length === 0) return null;

  return (
    <div className="my-5 position-relative">
      <h3 className="text-center fw-bold mb-4 text-uppercase" style={{ letterSpacing: '2px' }}>
        {title}
      </h3>

      <div className="position-relative px-4">
        <Row className="g-4 justify-content-center">
          {visibleProducts.map((prod) => (
            <Col key={prod.id_producto} md={4}>
              <div className="animate-fade-in">
                <ProductCard producto={prod} />
              </div>
            </Col>
          ))}
        </Row>

        {/* Controles Flotantes */}
        {products.length > itemsVisible && (
          <>
            <Button 
              variant="light" 
              className="position-absolute top-50 start-0 translate-middle-y shadow-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px', zIndex: 10 }}
              onClick={prev}
              disabled={!canScrollLeft}
            >
              <FaChevronLeft />
            </Button>

            <Button 
              variant="light" 
              className="position-absolute top-50 end-0 translate-middle-y shadow-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '40px', height: '40px', zIndex: 10 }}
              onClick={next}
              disabled={!canScrollRight}
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