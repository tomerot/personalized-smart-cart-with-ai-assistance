import { useState, useEffect, useRef } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";
import Numpad from "@/components/numpad/Numpad";

/**
 * BarcodeInputModal Component
 *
 * A modal for manually entering a barcode using a numpad
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onSubmit - Callback when barcode is submitted (receives barcode string)
 * @param {function} onClose - Callback when modal is closed/cancelled
 * @param {object} anchorRef - Optional ref to anchor element for tooltip positioning
 */
const BarcodeInputModal = ({ isOpen, onSubmit, onClose, anchorRef }) => {
  const [barcode, setBarcode] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowOffset, setArrowOffset] = useState(0);
  const popoverRef = useRef(null);

  // Reset barcode when modal opens
  useEffect(() => {
    if (isOpen) {
      setBarcode("");
    }
  }, [isOpen]);

  // Calculate position when modal opens (if anchorRef is provided)
  useEffect(() => {
    const calculatePosition = () => {
      if (isOpen && anchorRef?.current && popoverRef.current) {
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        
        // Position below the button, aligned to the right edge of the button
        let left = anchorRect.right - popoverRect.width;
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
    if (isOpen && anchorRef) {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isOpen, anchorRef]);

  // Prevent body scrolling when modal is open (only for centered modal)
  useEffect(() => {
    if (isOpen && !anchorRef) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, anchorRef]);

  const handleNumberClick = (digit) => {
    setBarcode((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setBarcode((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (barcode.length > 0) {
      onSubmit(barcode);
    }
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

  const isSubmitEnabled = barcode.length > 0;
  const isTooltipMode = !!anchorRef;

  return (
    <>
      {/* Invisible backdrop for tooltip mode - to capture clicks outside */}
      {isTooltipMode && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClose}
        />
      )}
      
      <div
        className={`fixed z-50 animate-fadeIn ${isTooltipMode ? '' : 'inset-0 flex items-center justify-center p-[2vw]'}`}
        onClick={!isTooltipMode ? handleClose : undefined}
        style={isTooltipMode ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      >
        {/* Backdrop - only for centered modal */}
        {!isTooltipMode && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}

        {/* Modal/Popover container */}
        <div
          ref={popoverRef}
          className={`relative flex flex-col items-center
                     ${isTooltipMode ? 'min-w-[min(320px,calc(100vw-32px))]' : 'min-w-[min(400px,90vw)] max-w-[min(500px,90vw)]'}
                     ${isTooltipMode ? 'p-6 pt-4' : 'p-8 pt-6'}
                     rounded-xl
                     shadow-lg border border-gray-200 bg-white`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Arrow pointer - only for tooltip mode */}
        {isTooltipMode && (
          <div 
            className="absolute -top-2 transform -translate-x-1/2"
            style={{ left: `${arrowOffset}px` }}
          >
            <div className="w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
          </div>
        )}
        
        {/* Close button - only for non-tooltip (centered modal) */}
        {!isTooltipMode && (
          <button
            onClick={handleClose}
            className="absolute top-4 left-4
                       hover:opacity-70 active:opacity-50 transition-opacity
                       cursor-pointer"
            aria-label="Close modal"
          >
            <Icon
              name={ICONS.CLOSE}
              size={32}
              weight={500}
              style={{ color: "#374151" }}
            />
          </button>
        )}

        {/* Icon and Title - only for non-tooltip (centered modal) */}
        {!isTooltipMode && (
          <div className="flex items-center gap-2 mb-6">
            <Icon
              name={ICONS.BARCODE}
              size={32}
              weight={500}
              style={{ color: "#16a34a" }}
            />
            <h2 className="font-semibold text-gray-800 text-xl">
              Enter Barcode
            </h2>
          </div>
        )}

        {/* Barcode Display */}
        <div
          className={`w-full mb-4 rounded-lg border-2 border-gray-200 bg-gray-50
                     text-center ${isTooltipMode ? 'px-3 py-2 text-xl min-h-[50px]' : 'px-4 py-3 text-2xl min-h-[60px]'} 
                     font-mono tracking-widest
                     flex items-center justify-center`}
        >
          {barcode || <span className="text-gray-400">Type Barcode</span>}
        </div>

        {/* Numpad */}
        <div className={`w-full ${isTooltipMode ? 'max-w-[240px]' : 'max-w-[280px]'}`}>
          <Numpad
            onNumberClick={handleNumberClick}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
            isSubmitEnabled={isSubmitEnabled}
            variant="modal"
          />
        </div>
        </div>
      </div>
    </>
  );
};

export default BarcodeInputModal;
