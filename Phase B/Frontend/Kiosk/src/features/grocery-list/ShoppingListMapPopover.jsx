/**
 * ShoppingListMapPopover Component
 * 
 * A popover displaying the store map with route markers and item cards.
 * Shows the optimized shopping route with numbered stops.
 * 
 * Marker colors:
 * - Green: Future stops
 * - Orange: Next/current stop
 * - Black: Completed stops
 */

import { useMemo } from 'react';
import StoreMap from '@/components/map/StoreMap';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

/**
 * Simple item card in the "Next Up" section (no checkbox, no price)
 */
function NextUpItemCard({ item }) {
  const { name, image_url, company, quantity } = item;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100">
      {/* Product image */}
      <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name={ICONS.CART} size={16} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {name}
        </h4>
        <p className="text-xs text-gray-500 truncate">{company}</p>
      </div>

      {/* Quantity */}
      <div className="flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">×{quantity}</span>
      </div>
    </div>
  );
}

/**
 * Section showing items at the current/next stop
 */
function NextUpSection({ categoryName, items }) {
  if (!items?.length) return null;

  return (
    <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
          <Icon name={ICONS.LOCATION} size={14} className="text-white" />
        </div>
        <h3 className="font-semibold text-orange-700 text-sm">Next Up: {categoryName}</h3>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <NextUpItemCard key={item.barcode} item={item} />
        ))}
      </div>
    </div>
  );
}

/**
 * Main popover component
 */
export default function ShoppingListMapPopover({ 
  shoppingList, 
  cartItemsMap, 
  skippedItems,
  onToggleSkip,
  onClose,
  buttonRef,
}) {
  // Calculate which stops are complete, current, and future
  const routeStatus = useMemo(() => {
    if (!shoppingList?.categoryOrder?.length || !shoppingList?.items?.length) {
      return { markers: [], currentStopIndex: -1, itemsByCategory: {} };
    }

    const itemsByCategory = {};
    shoppingList.items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    // Determine which categories are complete (all items collected or skipped)
    const categoryStatus = shoppingList.categoryOrder.map(category => {
      const categoryItems = itemsByCategory[category] || [];
      const allComplete = categoryItems.every(item => {
        const collectedQty = cartItemsMap.get(item.barcode) || 0;
        return collectedQty >= item.quantity || skippedItems.has(item.barcode);
      });
      return { category, complete: allComplete };
    });

    // Find first incomplete category (current stop)
    const currentStopIndex = categoryStatus.findIndex(s => !s.complete);

    // Build markers with appropriate colors
    const markers = shoppingList.routeCoordinates.map((coord, index) => {
      const status = categoryStatus[index];
      let color;
      
      if (status?.complete) {
        color = '#1f2937'; // Black - completed
      } else if (index === currentStopIndex) {
        color = '#f97316'; // Orange - current/next
      } else {
        color = '#16a34a'; // Green - future
      }

      return {
        x: coord.x,
        y: coord.y,
        type: 'numbered',
        label: String(index + 1),
        color,
        isComplete: status?.complete || false,
        isCurrent: index === currentStopIndex,
      };
    });

    return { 
      markers, 
      currentStopIndex, 
      itemsByCategory,
      currentCategory: currentStopIndex >= 0 ? shoppingList.categoryOrder[currentStopIndex] : null,
    };
  }, [shoppingList, cartItemsMap, skippedItems]);

  const { markers, currentStopIndex, itemsByCategory, currentCategory } = routeStatus;
  const currentItems = currentCategory ? itemsByCategory[currentCategory] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popover container */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[580px] max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn"
        style={{ marginTop: '60px' }}
      >
        {/* Caret pointing up */}
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"
        />
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name={ICONS.MAP} size={20} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Shopping Route</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Icon name={ICONS.CLOSE} size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Map - full width, larger size */}
        <div className="px-3 py-3 h-[300px]">
          <StoreMap 
            markers={markers}
            markerStyle="numbered"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span>Next Stop</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gray-800" />
              <span>Completed</span>
            </div>
          </div>

          {/* Next Up section */}
          {currentItems.length > 0 && (
            <NextUpSection
              categoryName={currentCategory}
              items={currentItems}
            />
          )}

          {/* All complete message */}
          {currentStopIndex === -1 && shoppingList?.items?.length > 0 && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name={ICONS.CHECK} size={28} weight={700} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-green-700">All Stops Complete!</h3>
              <p className="text-sm text-gray-500 mt-1">You've collected all items on your route</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
