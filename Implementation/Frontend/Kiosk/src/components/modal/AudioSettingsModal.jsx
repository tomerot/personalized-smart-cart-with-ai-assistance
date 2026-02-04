import { useState, useEffect, useRef, useCallback } from "react";

/**
 * AudioSettingsModal Component
 *
 * A tooltip popover for adjusting the system volume using a slider
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {object} anchorRef - Ref to anchor element for tooltip positioning
 * @param {number} volume - Current volume level (0-100)
 * @param {function} onVolumeChange - Callback when volume is changed
 * @param {boolean} isLoading - Whether volume is being loaded
 */
const AudioSettingsModal = ({ 
  isOpen, 
  onClose, 
  anchorRef, 
  volume, 
  onVolumeChange,
  isLoading = false 
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowOffset, setArrowOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const popoverRef = useRef(null);
  const sliderTrackRef = useRef(null);

  // Calculate position when modal opens
  useEffect(() => {
    const calculatePosition = () => {
      if (isOpen && anchorRef?.current && popoverRef.current) {
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        
        // Position below the button, aligned to the right edge
        let left = anchorRect.right - popoverRect.width;
        const top = anchorRect.bottom + 12; // 12px gap below button
        
        // Ensure popover stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const minLeft = 16;
        const maxLeft = viewportWidth - popoverRect.width - 16;
        
        // Clamp the left position
        const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));
        
        // Calculate arrow offset
        const buttonCenterX = anchorRect.left + (anchorRect.width / 2);
        const arrowX = buttonCenterX - clampedLeft;
        
        setPosition({ top, left: clampedLeft });
        setArrowOffset(arrowX);
      }
    };

    calculatePosition();
    
    if (isOpen) {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isOpen, anchorRef]);

  // Calculate volume from mouse/touch position
  const calculateVolumeFromPosition = useCallback((clientX) => {
    if (!sliderTrackRef.current) return volume;
    
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    return Math.round(percentage);
  }, [volume]);

  // Handle mouse/touch events on slider
  const handleSliderMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const newVolume = calculateVolumeFromPosition(e.clientX);
    onVolumeChange(newVolume);
  }, [calculateVolumeFromPosition, onVolumeChange]);

  const handleSliderTouchStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    const newVolume = calculateVolumeFromPosition(touch.clientX);
    onVolumeChange(newVolume);
  }, [calculateVolumeFromPosition, onVolumeChange]);

  // Handle drag movement
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX) => {
      const newVolume = calculateVolumeFromPosition(clientX);
      onVolumeChange(newVolume);
    };

    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
    
    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, calculateVolumeFromPosition, onVolumeChange]);

  const handleClose = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

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
          className="relative flex flex-col
                     min-w-[280px]
                     p-5
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

          {/* Label */}
          <span className="font-[Montserrat] text-lg font-bold text-gray-800 mb-2">
            Volume
          </span>

          {/* Separator line */}
          <div className="w-full h-px bg-gray-300 mb-4" />

          {/* Slider row with percentage */}
          <div className="flex items-center gap-4">
            {/* Slider Track */}
            <div 
              ref={sliderTrackRef}
              className="relative flex-1 h-3 bg-gray-200 rounded-full cursor-pointer touch-none"
              onMouseDown={handleSliderMouseDown}
              onTouchStart={handleSliderTouchStart}
            >
              {/* Filled portion */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-75"
                style={{ width: `${volume}%` }}
              />
              
              {/* Thumb */}
              <div 
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 
                           w-6 h-6 bg-white rounded-full shadow-md border-2 border-green-500
                           transition-transform duration-75
                           ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
                style={{ left: `${volume}%` }}
              />
            </div>

            {/* Volume percentage */}
            <div className="min-w-[50px] text-right">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin ml-auto" />
              ) : (
                <span className="font-[Montserrat] text-lg font-semibold text-gray-800">
                  {volume}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioSettingsModal;
