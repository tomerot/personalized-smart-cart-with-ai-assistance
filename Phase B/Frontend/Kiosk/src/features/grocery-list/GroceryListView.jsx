/**
 * GroceryListView Component
 * Displays the user's pre-loaded shopping list with items to collect
 * Items can be checked off as they're added to the cart
 * 
 * Shopping list is fetched only when user clicks "Load List" button
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

/**
 * Individual shopping list item component with optional Next Up wrapper
 */
function ShoppingListItemWithNextUp({ item, isCollected, collectedQuantity, isSkipped, onToggleSkip, isNextUp }) {
  const { name, image_url, company, quantity, barcode } = item;
  
  // Calculate progress for partial collection
  const isPartiallyCollected = collectedQuantity > 0 && collectedQuantity < quantity;
  const isFullyCollected = collectedQuantity >= quantity;

  const itemCard = (
    <div 
      className={`p-3 rounded-xl border transition-all duration-200 ${
        isFullyCollected 
          ? 'bg-green-50 border-green-200' 
          : isSkipped
          ? 'bg-gray-100 border-gray-200 opacity-60'
          : isPartiallyCollected
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox indicator - touchable for skip */}
        <button
          onClick={() => !isFullyCollected && onToggleSkip(barcode)}
          disabled={isFullyCollected}
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isFullyCollected 
              ? 'bg-green-500 cursor-default' 
              : isSkipped
              ? 'bg-gray-400 hover:bg-gray-500 cursor-pointer'
              : isPartiallyCollected
              ? 'bg-amber-400'
              : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
          }`}
        >
          {isFullyCollected ? (
            <Icon name={ICONS.CHECK} size={16} weight={700} className="text-white" />
          ) : isSkipped ? (
            <Icon name={ICONS.CANCEL} size={14} weight={600} className="text-white" />
          ) : isPartiallyCollected ? (
            <span className="text-white text-xs font-bold">{collectedQuantity}</span>
          ) : null}
        </button>

        {/* Product image */}
        <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className={`w-full h-full object-contain transition-opacity ${
                isFullyCollected || isSkipped ? 'opacity-50 grayscale' : ''
              }`}
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
          <h3 className={`font-medium text-sm line-clamp-1 transition-colors ${
            isFullyCollected || isSkipped ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}>
            {name}
          </h3>
          <p className={`text-xs truncate ${
            isFullyCollected || isSkipped ? 'text-gray-300' : 'text-gray-500'
          }`}>
            {company}
          </p>
        </div>

        {/* Quantity */}
        <div className={`shrink-0 mr-8 ${
          isFullyCollected || isSkipped ? 'text-gray-400' : 'text-gray-700'
        }`}>
          <span className="text-lg font-semibold">×{quantity}</span>
        </div>
      </div>
    </div>
  );

  // If this is the next up item, wrap it in the orange section
  if (isNextUp) {
    return (
      <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
        {/* Header */}
        <div className="mb-2">
          <h3 className="font-semibold text-orange-700 text-sm">Up Next</h3>
        </div>
        {itemCard}
      </div>
    );
  }

  return itemCard;
}

/**
 * Empty state component - before list is loaded
 */
function EmptyState({ hasShoppingList }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4 -mt-9">
      <Icon 
        name={hasShoppingList ? ICONS.LOAD_LIST : ICONS.LOAD_LIST_DISABLED} 
        size={64} 
        weight={350}
        style={{ color: "#9ca3af", marginBottom: "16px" }}
      />
      {hasShoppingList ? (
        <>
          <p className="font-bold text-lg mb-3">Shopping List Found</p>
          <p className="text-center text-sm">
            Tap <span className="font-semibold">"Load List"</span> to view your shopping list
            <br />
            and collect your products in an efficient order
          </p>
        </>
      ) : (
        <>
          <p className="font-bold text-lg mb-3">No Shopping List Found</p>
          <p className="text-center text-sm">
            Create a shopping list in the app ahead of your next visit,
            <br />
            it will make your shopping faster and easier
          </p>
        </>
      )}
    </div>
  );
}

/**
 * All collected celebration component
 */
function AllCollectedState({ totalItems }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Icon name={ICONS.CHECK} size={32} weight={700} className="text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-green-700 mb-1">All Items Collected!</h3>
      <p className="text-gray-500 text-sm">
        You've collected all {totalItems} items from your list
      </p>
    </div>
  );
}

/**
 * Main GroceryListView component
 * Note: Shopping list state is managed by parent (DashboardLayout)
 */
export default function GroceryListView({ 
  shoppingList, 
  skippedItems, 
  onToggleSkip,
}) {
  const { hasShoppingList } = useUser();
  const { cartItems } = useCart();

  // Touch/drag scrolling state
  const scrollContainerRef = useRef(null);
  const nextUpRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Handle mouse/touch start
  const handleDragStart = useCallback((e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    
    // Get the Y position from mouse or touch event
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setScrollTop(container.scrollTop);

    // Prevent text selection during drag
    e.preventDefault();
  }, []);

  // Handle mouse/touch move
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Get the Y position from mouse or touch event
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    
    // Calculate the distance moved
    const deltaY = clientY - startY;
    
    // Inverted scrolling: drag up scrolls down, drag down scrolls up
    container.scrollTop = scrollTop - deltaY;

    e.preventDefault();
  }, [isDragging, startY, scrollTop]);

  // Handle mouse/touch end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Create a map of cart items by barcode for quick lookup
  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach(item => {
      // Cart uses 'id' which is the barcode
      map.set(item.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  // Calculate stats and collection status
  const stats = useMemo(() => {
    if (!shoppingList?.items?.length) {
      return { totalItems: 0, collectedItems: 0 };
    }

    let totalItems = 0;
    let collectedItems = 0;

    shoppingList.items.forEach(item => {
      // Skip items that user has marked as skipped
      if (skippedItems?.has(item.barcode)) {
        return;
      }
      
      totalItems += item.quantity;
      
      const collectedQty = cartItemsMap.get(item.barcode) || 0;
      const effectiveCollected = Math.min(collectedQty, item.quantity);
      collectedItems += effectiveCollected;
    });

    return { totalItems, collectedItems };
  }, [shoppingList, cartItemsMap, skippedItems]);

  const allCollected = stats.totalItems > 0 && stats.collectedItems >= stats.totalItems;
  const progressPercent = stats.totalItems > 0 
    ? Math.round((stats.collectedItems / stats.totalItems) * 100) 
    : 0;

  // Calculate next up coordinate index for auto-scroll
  const nextUpCoordIndex = useMemo(() => {
    if (!shoppingList?.items?.length || !shoppingList?.categoryOrder || !shoppingList?.routeCoordinates) {
      return -1;
    }

    const itemsByCategory = {};
    shoppingList.items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    return shoppingList.categoryOrder.findIndex(category => {
      const categoryItems = itemsByCategory[category] || [];
      return categoryItems.some(item => {
        const collectedQty = cartItemsMap.get(item.barcode) || 0;
        const isSkipped = skippedItems?.has(item.barcode);
        return collectedQty < item.quantity && !isSkipped;
      });
    });
  }, [shoppingList, cartItemsMap, skippedItems]);

  // Auto-scroll to "Next Stop" section when it changes
  useEffect(() => {
    if (nextUpRef.current && nextUpCoordIndex >= 0) {
      nextUpRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [nextUpCoordIndex]);

  // Empty state - no list loaded yet
  if (!shoppingList || !shoppingList.items?.length) {
    return <EmptyState hasShoppingList={hasShoppingList} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Hide scrollbar style */}
      <style>
        {`
          .grocery-list-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Items list - scrollable with touch/drag */}
      <div 
        ref={scrollContainerRef}
        className={`
          grocery-list-scroll
          flex-1 
          overflow-y-auto 
          space-y-2 
          min-h-0
          select-none
          ${isDragging ? "cursor-grabbing" : "cursor-grab"}
        `}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {(() => {
          // Group items by their category to find coordinates
          const itemsByCategory = {};
          shoppingList.items.forEach(item => {
            if (!itemsByCategory[item.category]) {
              itemsByCategory[item.category] = [];
            }
            itemsByCategory[item.category].push(item);
          });

          // Find the first coordinate location that has uncollected items
          let nextUpCoordIndex = -1;
          if (shoppingList.categoryOrder && shoppingList.routeCoordinates) {
            nextUpCoordIndex = shoppingList.categoryOrder.findIndex(category => {
              const categoryItems = itemsByCategory[category] || [];
              return categoryItems.some(item => {
                const collectedQty = cartItemsMap.get(item.barcode) || 0;
                const isSkipped = skippedItems?.has(item.barcode);
                return collectedQty < item.quantity && !isSkipped;
              });
            });
          }

          // Get the coordinate for the next location
          const nextUpCoord = nextUpCoordIndex >= 0 && shoppingList.routeCoordinates 
            ? shoppingList.routeCoordinates[nextUpCoordIndex] 
            : null;

          // Find all categories at the same coordinate as nextUpCoord
          const nextUpCategories = new Set();
          if (nextUpCoord && shoppingList.categoryOrder && shoppingList.routeCoordinates) {
            shoppingList.routeCoordinates.forEach((coord, idx) => {
              if (coord.x === nextUpCoord.x && coord.y === nextUpCoord.y) {
                nextUpCategories.add(shoppingList.categoryOrder[idx]);
              }
            });
          }

          // Group items by coordinate for rendering
          const itemsGroupedByCoord = [];
          let currentCoordKey = null;
          let currentGroup = [];

          shoppingList.items.forEach((item, index) => {
            const collectedQty = cartItemsMap.get(item.barcode) || 0;
            const isSkipped = skippedItems?.has(item.barcode);
            const isFullyCollected = collectedQty >= item.quantity;
            
            // Check if this item is at the "next up" coordinate
            const isNextUp = nextUpCategories.has(item.category);
            
            // Find coordinate for this item's category
            const categoryIndex = shoppingList.categoryOrder?.indexOf(item.category);
            const coord = categoryIndex >= 0 && shoppingList.routeCoordinates?.[categoryIndex];
            const coordKey = coord ? `${coord.x},${coord.y}` : 'unknown';

            // If coordinate changes and we have items in current group, flush the group
            if (coordKey !== currentCoordKey && currentGroup.length > 0) {
              const groupIsNextUp = currentGroup[0].isNextUp;
              itemsGroupedByCoord.push({
                isNextUp: groupIsNextUp,
                items: currentGroup,
              });
              currentGroup = [];
            }

            currentCoordKey = coordKey;
            currentGroup.push({
              item,
              isCollected: isFullyCollected,
              collectedQuantity: collectedQty,
              isSkipped,
              isNextUp,
            });

            // If this is the last item, flush the group
            if (index === shoppingList.items.length - 1 && currentGroup.length > 0) {
              const groupIsNextUp = currentGroup[0].isNextUp;
              itemsGroupedByCoord.push({
                isNextUp: groupIsNextUp,
                items: currentGroup,
              });
            }
          });

          // Render groups
          return itemsGroupedByCoord.map((group, groupIndex) => {
            if (group.isNextUp) {
              // Render "Next Stop" section with all items at this coordinate
              return (
                <div key={`group-${groupIndex}`} ref={nextUpRef} className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                  {/* Header */}
                  <div className="mb-2">
                    <h3 className="font-semibold text-orange-700 text-sm">Next Stop</h3>
                  </div>
                  {/* Items at this coordinate */}
                  <div className="space-y-2">
                    {group.items.map(({ item, isCollected, collectedQuantity, isSkipped }) => (
                      <ShoppingListItemWithNextUp
                        key={item.barcode}
                        item={item}
                        isCollected={isCollected}
                        collectedQuantity={collectedQuantity}
                        isSkipped={isSkipped}
                        onToggleSkip={onToggleSkip}
                        isNextUp={false} // Don't double-wrap
                      />
                    ))}
                  </div>
                </div>
              );
            } else {
              // Render regular items
              return group.items.map(({ item, isCollected, collectedQuantity, isSkipped }) => (
                <ShoppingListItemWithNextUp
                  key={item.barcode}
                  item={item}
                  isCollected={isCollected}
                  collectedQuantity={collectedQuantity}
                  isSkipped={isSkipped}
                  onToggleSkip={onToggleSkip}
                  isNextUp={false}
                />
              ));
            }
          });
        })()}
      </div>

      {/* Progress bar - bottom */}
      <div className="mt-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex-1">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
            {stats.collectedItems}/{stats.totalItems} Products Collected
          </span>
        </div>
      </div>
    </div>
  );
}
