import { useRef, useState } from "react";

/**
 * Custom hook to manage Shopping Route modal state
 */
export function useShoppingRoute() {
  const [showShoppingRoute, setShowShoppingRoute] = useState(false);
  const actionButtonRef = useRef(null);

  const handleToggleShoppingRoute = () => {
    setShowShoppingRoute(prev => !prev);
  };

  return {
    showShoppingRoute,
    actionButtonRef,
    handleToggleShoppingRoute,
    setShowShoppingRoute,
  };
}

