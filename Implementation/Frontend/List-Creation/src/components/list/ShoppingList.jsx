import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';
import ShoppingListItem from './ShoppingListItem';
import { formatPrice } from '@/utils';

/**
 * Shopping List Component
 * Displays all items in the shopping list
 */
const ShoppingList = ({
  items,
  onQuantityChange,
  onRemove,
  onSave,
  onClear,
  isSaving,
  hasChanges,
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name={ICONS.GROCERY_LIST} size={22} className="text-green-500 flex-shrink-0" />
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
            My List
          </h2>
          {items.length > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs sm:text-sm font-medium rounded-full flex-shrink-0">
              {totalItems}
            </span>
          )}
        </div>
        {hasChanges && (
          <span className="text-xs text-orange-500 font-medium flex-shrink-0">Unsaved</span>
        )}
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icon name={ICONS.CART} size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 mb-1">Your list is empty</p>
            <p className="text-gray-400 text-sm">Search for products to add them</p>
          </div>
        ) : (
          items.map((item) => (
            <ShoppingListItem
              key={item.barcode}
              item={item}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Footer with total and actions */}
      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Total */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">Estimated Total:</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClear}
              disabled={isSaving}
              className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium text-sm sm:text-base
                       border-2 border-gray-200 text-gray-600
                       hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100
                       transition-colors flex items-center justify-center gap-1.5 sm:gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name={ICONS.CLEAR} size={18} />
              <span>Clear</span>
            </button>

            <button
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium text-sm sm:text-base
                       flex items-center justify-center gap-1.5 sm:gap-2 transition-all
                       ${
                         hasChanges && !isSaving
                           ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-md hover:shadow-lg'
                           : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                       }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icon name={ICONS.SAVE} size={18} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
