import StoreMap from '../map/StoreMap';

/**
 * ProductLocationContent Component
 * 
 * Displays product location result in a chat bubble.
 * Shows the assistant's response text with a map marking the product location.
 * 
 * @param {string} responseText - The assistant's response text
 * @param {Object} productLocation - Product location data: { name, category, location: { x, y }, available }
 */
const ProductLocationContent = ({
  responseText = "",
  productLocation = null,
}) => {
  const markers = productLocation?.location
    ? [{ x: productLocation.location.x, y: productLocation.location.y, type: 'location' }]
    : [];

  return (
    <div className="product-location-content">
      {/* Response text */}
      {responseText && (
        <p className="mb-2">{responseText}</p>
      )}

      {/* Map with location marker */}
      {productLocation?.location && (
        <div className="product-location-map" style={{ height: '310px' }}>
          <StoreMap markers={markers} />
        </div>
      )}
    </div>
  );
};

export default ProductLocationContent;

