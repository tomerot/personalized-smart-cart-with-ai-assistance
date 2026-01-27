/**
 * GroceryListView Component
 * Displays the user's pre-loaded shopping list with items to collect
 * Items can be checked off as they're added to the cart
 * 
 * Shopping list is fetched only when user clicks "Load List" button
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

/**
 * Individual shopping list item component
 */
function ShoppingListItem({ item, isCollected, collectedQuantity, isSkipped, onToggleSkip }) {
  const { name, image_url, company, quantity } = item;
  
  // Calculate progress for partial collection
  const isPartiallyCollected = collectedQuantity > 0 && collectedQuantity < quantity;
  const isFullyCollected = collectedQuantity >= quantity;

  return (
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
          onClick={() => !isFullyCollected && onToggleSkip(item.barcode)}
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
        <div className={`shrink-0 ${
          isFullyCollected || isSkipped ? 'text-gray-400' : 'text-gray-700'
        }`}>
          <span className="text-sm font-medium">×{quantity}</span>
        </div>
      </div>
    </div>
  );
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

  // Empty state - no list loaded yet
  if (!shoppingList || !shoppingList.items?.length) {
    return <EmptyState hasShoppingList={hasShoppingList} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress header */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {stats.collectedItems} of {stats.totalItems} items collected
          </span>
          <span className="text-sm font-semibold text-green-600">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

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
        {allCollected ? (
          <AllCollectedState totalItems={stats.totalItems} />
        ) : (
          shoppingList.items.map((item) => {
            const collectedQty = cartItemsMap.get(item.barcode) || 0;
            const isSkipped = skippedItems?.has(item.barcode);
            return (
              <ShoppingListItem
                key={item.barcode}
                item={item}
                isCollected={collectedQty >= item.quantity}
                collectedQuantity={collectedQty}
                isSkipped={isSkipped}
                onToggleSkip={onToggleSkip}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
