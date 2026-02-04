import { useState } from "react";

/**
 * Custom hook to manage Help modal state
 */
export function useHelp() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  const handleCloseHelp = () => {
    setShowHelpModal(false);
  };

  return {
    showHelpModal,
    handleHelpClick,
    handleCloseHelp,
  };
}

