import { useState, useEffect } from 'react';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';

/**
 * Search Bar Component
 * With debounced search
 */
const SearchBar = ({ onSearch, isLoading, placeholder = 'Search products...' }) => {
  const [query, setQuery] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
        ) : (
          <Icon name={ICONS.SEARCH} size={20} className="text-gray-400" />
        )}
      </div>

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3 md:py-4 text-base md:text-lg
                 border-2 border-gray-200 rounded-xl
                 focus:border-green-500 focus:ring-0 outline-none transition-colors
                 placeholder:text-gray-400"
      />

      {/* Clear button */}
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
        >
          <Icon name={ICONS.CLOSE} size={20} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
