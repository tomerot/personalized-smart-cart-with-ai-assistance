import { useState, useEffect, useRef } from "react";
import Numpad from "@/components/numpad/Numpad";

/**
 * BarcodeInputModal Component
 *
 * A tooltip popover for manually entering a barcode using a numpad
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onSubmit - Callback when barcode is submitted (receives barcode string)
 * @param {function} onClose - Callback when modal is closed/cancelled
 * @param {object} anchorRef - Ref to anchor element for tooltip positioning
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

  // Calculate position when modal opens
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
    if (isOpen) {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isOpen, anchorRef]);

  const handleNumberClick = (digit) => {
    setBarcode((prev) => {
      // Limit to 13 digits
      if (prev.length >= 13) return prev;
      return prev + digit;
    });
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

  return (
    <>
      {/* Invisible backdrop to capture clicks outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={handleClose}
      />
      
      <div
        className="fixed z-50 animate-fadeIn"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Popover container */}
        <div
          ref={popoverRef}
          className="relative flex flex-col items-center
                     min-w-[min(320px,calc(100vw-32px))]
                     p-6 pt-4
                     rounded-xl
                     shadow-lg border border-gray-200 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Arrow pointer */}
        <div 
          className="absolute -top-2 transform -translate-x-1/2"
          style={{ left: `${arrowOffset}px` }}
        >
          <div className="w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
        </div>

        {/* Barcode Display */}
        <div
          className="w-full mb-4 rounded-lg border-2 border-gray-200 bg-gray-50
                     text-center px-3 py-2 text-xl min-h-[50px]
                     font-mono tracking-widest
                     flex items-center justify-center"
        >
          {barcode || <span className="text-gray-400">Barcode Number</span>}
        </div>

        {/* Numpad */}
        <div className="w-full max-w-[240px]">
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
