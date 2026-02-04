import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';
import { formatPrice } from '@/utils';

/**
 * Shopping List Item Component
 * For displaying items in the list with quantity controls
 */
const ShoppingListItem = ({ item, onQuantityChange, onRemove }) => {
  const { name, image_url, company, price, size, quantity } = item;
  const totalPrice = price * quantity;

  return (
    <div className="p-3 bg-white rounded-xl border border-gray-100">
      {/* Top row: Image, Info, Delete button */}
      <div className="flex items-start gap-3">
        {/* Product image */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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
          <h3 className="font-medium text-gray-900 text-sm md:text-base line-clamp-2">{name}</h3>
          <p className="text-xs md:text-sm text-gray-500 truncate">{company}</p>
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(item)}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Remove item"
        >
          <Icon name={ICONS.DELETE} size={18} />
        </button>
      </div>

      {/* Bottom row: Price and Quantity controls */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        {/* Price info */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-600 text-sm md:text-base">
            {formatPrice(totalPrice)}
          </span>
          {quantity > 1 && (
            <span className="text-xs text-gray-400">({formatPrice(price)} each)</span>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQuantityChange(item, quantity - 1)}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg
                     bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 transition-colors"
            aria-label="Decrease quantity"
          >
            <Icon name={ICONS.REMOVE} size={18} weight={600} />
          </button>

          <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>

          <button
            onClick={() => onQuantityChange(item, quantity + 1)}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg
                     bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-600 transition-colors"
            aria-label="Increase quantity"
          >
            <Icon name={ICONS.ADD} size={18} weight={600} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListItem;
