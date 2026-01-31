import { useState } from "react";

/**
 * Custom hook to manage Profile modal state
 */
export function useProfile() {
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleCloseProfile = () => {
    setShowProfileModal(false);
  };

  return {
    showProfileModal,
    handleProfileClick,
    handleCloseProfile,
  };
}

