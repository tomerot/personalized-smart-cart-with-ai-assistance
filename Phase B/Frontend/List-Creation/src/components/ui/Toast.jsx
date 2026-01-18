import { useEffect } from 'react';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

/**
 * Toast Component
 * For showing success/error messages
 */
const Toast = ({
  isVisible,
  onClose,
  message,
  variant = 'success', // 'success' | 'error' | 'warning' | 'info'
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const variantStyles = {
    success: {
      bg: 'bg-green-500',
      icon: ICONS.CHECK,
    },
    error: {
      bg: 'bg-red-500',
      icon: ICONS.ERROR,
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: ICONS.WARNING,
    },
    info: {
      bg: 'bg-blue-500',
      icon: ICONS.INFO,
    },
  };

  const styles = variantStyles[variant] || variantStyles.success;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${styles.bg}`}
      >
        <Icon name={styles.icon} size={24} fill={1} />
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close"
        >
          <Icon name={ICONS.CLOSE} size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
