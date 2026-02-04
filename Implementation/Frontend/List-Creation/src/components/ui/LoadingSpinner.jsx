/**
 * Loading Spinner Component
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-green-200 border-t-green-500 rounded-full animate-spin ${className}`}
    />
  );
};

export default LoadingSpinner;
