import { useState } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function ProductCarousel({ title, products }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsVisible = 3;

  if (!products || products.length === 0) return null;

  const next = () => {
    setStartIndex((prev) => (prev + 1) % products.length);
  };

  const prev = () => {
    setStartIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const getVisibleProducts = () => {
    const visible = [];
    for (let i = 0; i < itemsVisible; i++) {
      const index = (startIndex + i) % products.length;
      visible.push(products[index]);
    }
    return visible;
  };

  const visibleProducts = getVisibleProducts();
  const showControls = products.length > itemsVisible;

  return (
    <div className="my-5 position-relative">
      <h3 className="text-center fw-bold mb-4 text-uppercase" style={{ letterSpacing: '2px' }}>
        {title}
      </h3>

      <div className="position-relative px-4">
        <Row className={`g-4 ${!showControls ? 'justify-content-center' : ''}`}>
          {visibleProducts.map((prod, index) => (
            // KEY ÚNICA: Usamos el ID del producto + el índice del renderizado visual
            // Esto es crucial en carruseles circulares donde un producto puede repetirse visualmente
            <Col key={`${prod.id_producto}-visual-${index}`} md={4}>
              <div className="animate-fade-in">
                <ProductCard producto={prod} />
              </div>
            </Col>
          ))}
        </Row>

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