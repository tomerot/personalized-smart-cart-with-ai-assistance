import { ICONS } from "@/components/icons/icons.config";
import WarningModal from "@/components/modal/WarningModal";
import MessageModal from "@/components/modal/MessageModal";
import ForgotItemsModal from "@/components/modal/ForgotItemsModal";
import CheckoutSuccessModal from "@/components/modal/CheckoutSuccessModal";
import ShoppingRouteModal from "@/components/modal/ShoppingRouteModal";
import AudioSettingsModal from "@/components/modal/AudioSettingsModal";
import HelpModal from "@/components/modal/HelpModal";

/**
 * DashboardModals - Container for all dashboard modal dialogs
 */
function DashboardModals({
  // Leave modal
  showLeaveModal,
  onCancelLeave,
  onConfirmLeave,
  // Error modal
  showErrorModal,
  errorMessage,
  onCloseError,
  // Checkout modals
  showForgotItemsModal,
  onCloseForgotItems,
  onAddSuggestedItem,
  onProceedToCheckout,
  checkoutSuggestions,
  isLoadingSuggestions,
  showCheckoutSuccessModal,
  onCheckoutComplete,
  // Incomplete list modal
  showIncompleteListModal,
  onCloseIncompleteList,
  onProceedWithIncompleteList,
  // Shopping route modal
  showShoppingRoute,
  onCloseShoppingRoute,
  actionButtonRef,
  shoppingList,
  cartItemsMap,
  skippedItems,
  // Audio settings modal
  showAudioSettings,
  onCloseAudioSettings,
  audioButtonRef,
  volume,
  onVolumeChange,
  isLoadingVolume,
  // Help modal
  showHelpModal,
  onCloseHelp,
}) {
  return (
    <>
      {/* Leave Warning Modal */}
      <WarningModal
        isOpen={showLeaveModal}
        onClose={onCancelLeave}
        onProceed={onConfirmLeave}
        title="You Are About to Leave"
        message={
          <>
            Your cart and conversation history will be cleared.
            <br />
            Are you sure you want to leave?
          </>
        }
        proceedText="Leave Anyway"
      />

      {/* Error Modal */}
      <MessageModal
        isOpen={showErrorModal}
        onClose={onCloseError}
        icon={ICONS.NOT_FOUND}
        message={errorMessage}
        iconColor="black"
        textColor="black"
      />

      {/* Forgot Items Modal (Checkout Suggestions) */}
      <ForgotItemsModal
        isOpen={showForgotItemsModal}
        onClose={onCloseForgotItems}
        onAddItem={onAddSuggestedItem}
        onCheckout={onProceedToCheckout}
        suggestions={checkoutSuggestions}
        isLoading={isLoadingSuggestions}
      />

      {/* Checkout Success Modal */}
      <CheckoutSuccessModal
        isOpen={showCheckoutSuccessModal}
        onClose={onCheckoutComplete}
      />

      {/* Incomplete List Warning Modal */}
      <WarningModal
        isOpen={showIncompleteListModal}
        onClose={onCloseIncompleteList}
        onProceed={onProceedWithIncompleteList}
        title="Products Not Collected"
        message={
          <>
            You haven't collected all products from the shopping list.
            <br />
            Are you sure you want to proceed to checkout?
          </>
        }
        proceedText="Proceed Anyway"
      />

      {/* Shopping Route Modal */}
      <ShoppingRouteModal
        isOpen={showShoppingRoute && shoppingList !== null}
        onClose={onCloseShoppingRoute}
        anchorRef={actionButtonRef}
        shoppingList={shoppingList}
        cartItemsMap={cartItemsMap}
        skippedItems={skippedItems}
      />

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={showAudioSettings}
        onClose={onCloseAudioSettings}
        anchorRef={audioButtonRef}
        volume={volume}
        onVolumeChange={onVolumeChange}
        isLoading={isLoadingVolume}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={onCloseHelp}
      />
    </>
  );
}

export default DashboardModals;

