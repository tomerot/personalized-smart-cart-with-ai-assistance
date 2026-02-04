import { useState, useEffect } from "react";

/**
 * Custom hook to manage view transitions with fade effect
 * 
 * @param {string} initialView - The initial view to display
 * @returns {Object} View transition state and setters
 */
export function useViewTransition(initialView) {
  const [activeView, setActiveView] = useState(initialView);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayView, setDisplayView] = useState(initialView);

  useEffect(() => {
    if (activeView !== displayView) {
      // Start fade out
      setIsTransitioning(true);
      
      // After fade out completes, change content and fade in
      const timer = setTimeout(() => {
        setDisplayView(activeView);
        setIsTransitioning(false);
      }, 400); // Half of 0.8s animation duration
      
      return () => clearTimeout(timer);
    }
  }, [activeView, displayView]);

  return {
    activeView,
    setActiveView,
    isTransitioning,
    displayView,
  };
}

