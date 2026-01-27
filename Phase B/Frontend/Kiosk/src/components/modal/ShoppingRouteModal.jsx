/**
 * ShoppingRouteModal Component
 * 
 * A tooltip popover displaying the store map with route markers and item cards.
 * Shows the optimized shopping route with numbered stops.
 * 
 * Marker colors:
 * - Green: Future stops
 * - Orange: Next/current stop
 * - Black: Completed stops
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {object} anchorRef - Ref to anchor element for tooltip positioning
 * @param {object} shoppingList - Shopping list data
 * @param {Map} cartItemsMap - Map of cart items
 * @param {Set} skippedItems - Set of skipped item barcodes
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import StoreMap from '@/components/map/StoreMap';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

const ShoppingRouteModal = ({ 
  isOpen,
  onClose,
  anchorRef,
  shoppingList, 
  cartItemsMap, 
  skippedItems,
}) => {
  // Touch/drag scrolling state
  const scrollContainerRef = useRef(null);
  const popoverRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowOffset, setArrowOffset] = useState(0);

  // Calculate position when modal opens
  useEffect(() => {
    const calculatePosition = () => {
      if (isOpen && anchorRef?.current && popoverRef.current) {
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        
        // Calculate center position relative to the button
        // Center of button = anchorRect.left + (anchorRect.width / 2)
        // Center of popover = left + (popoverRect.width / 2)
        // So: left = (anchorRect.left + anchorRect.width / 2) - (popoverRect.width / 2)
        let left = (anchorRect.left + (anchorRect.width / 2)) - (popoverRect.width / 2);
        
        const top = anchorRect.bottom + 12; // 12px gap below button
        
        // Ensure popover stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const minLeft = 16; // 16px minimum margin from left edge
        const maxLeft = viewportWidth - popoverRect.width - 16; // 16px margin from right edge
        
        // Clamp the left position
        const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));
        
        // Calculate arrow offset (where the button center is relative to popover)
        const buttonCenterX = anchorRect.left + (anchorRect.width / 2);
        const arrowX = buttonCenterX - clampedLeft;
        
        setPosition({ top, left: clampedLeft });
        setArrowOffset(arrowX);
      }
    };

    calculatePosition();
    
    // Recalculate on window resize
    if (isOpen) {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isOpen, anchorRef]);

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

  // Handle close
  const handleClose = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    onClose();
  };

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

  const { markers, currentStopIndex } = routeStatus;

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to capture clicks outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={handleClose}
      />
      
      {/* Tooltip popover */}
      <div
        className="fixed z-50 animate-fadeIn"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Arrow pointer */}
        <div 
          className="absolute -top-2 transform -translate-x-1/2 z-10"
          style={{ left: `${arrowOffset}px` }}
        >
          <div className="w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
        </div>

        {/* Popover container */}
        <div 
          ref={popoverRef}
          className="relative bg-white rounded-xl shadow-lg border border-gray-200 w-[700px] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Map - full width, larger size */}
          <div className="p-3 h-[330px] shrink-0">
            <StoreMap 
              markers={markers}
              markerStyle="numbered"
            />
          </div>

          {/* Hide scrollbar style */}
          <style>
            {`
              .popover-scroll-container::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          {/* Content - scrollable with touch/drag */}
          <div 
            ref={scrollContainerRef}
            className={`
              popover-scroll-container
              flex-1 
              overflow-y-auto 
              px-4 
              pb-4 
              space-y-4
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
    </>
  );
};

export default ShoppingRouteModal;

