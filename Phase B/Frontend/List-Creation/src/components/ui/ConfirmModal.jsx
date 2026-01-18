import Modal from './Modal';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

/**
 * Confirm Modal Component
 * For confirmation dialogs (delete, clear, etc.)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
}) => {
  const variantStyles = {
    danger: {
      icon: ICONS.WARNING,
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    },
    warning: {
      icon: ICONS.WARNING,
      iconColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
    },
    info: {
      icon: ICONS.INFO,
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`mb-4 ${styles.iconColor}`}>
          <Icon name={styles.icon} size={56} weight={400} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors ${styles.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
