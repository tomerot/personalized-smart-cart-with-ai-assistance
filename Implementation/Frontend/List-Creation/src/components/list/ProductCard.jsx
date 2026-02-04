import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';
import { formatPrice } from '@/utils';

/**
 * Product Card Component
 * For displaying search results
 */
const ProductCard = ({ product, onAdd, isInList }) => {
  const { name, image_url, company, price, size } = product;

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Product image */}
      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center ${image_url ? 'hidden' : 'flex'}`}
        >
          <Icon name={ICONS.CART} size={20} className="text-gray-300" />
        </div>
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">{name}</h3>
        <p className="text-xs sm:text-sm text-gray-500 truncate">{company}</p>
        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
          <span className="font-semibold text-green-600 text-sm sm:text-base">{formatPrice(price)}</span>
          {size && <span className="text-xs text-gray-400 hidden sm:inline">{size}</span>}
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd(product)}
        className={`flex-shrink-0 p-2 sm:p-3 rounded-xl transition-all
                  ${
                    isInList
                      ? 'bg-green-100 text-green-600'
                      : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-md hover:shadow-lg'
                  }`}
        title={isInList ? 'Already in list (tap to add more)' : 'Add to list'}
      >
        <Icon name={ICONS.ADD} size={20} weight={600} />
      </button>
    </div>
  );
};

export default ProductCard;
