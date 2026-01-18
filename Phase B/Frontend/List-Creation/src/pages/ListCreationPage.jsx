import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/icons/Icon';
import { ICONS } from '@/components/icons/icons.config';
import { Toast, ConfirmModal, LoadingSpinner } from '@/components/ui';
import { SearchBar, ProductCard, ShoppingList } from '@/components/list';
import { productService, shoppingListService } from '@/services';

function ListCreationPage() {
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Shopping list state
  const [listItems, setListItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' });
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check authentication
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth/phone', { replace: true });
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  // Load existing shopping list
  useEffect(() => {
    const loadShoppingList = async () => {
      if (!user?.phone) return;

      setIsLoadingList(true);
      const result = await shoppingListService.getShoppingList(user.phone);
      setIsLoadingList(false);

      if (result.success && result.data?.items) {
        setListItems(result.data.items);
        setOriginalItems(result.data.items);
      }
    };

    loadShoppingList();
  }, [user?.phone]);

  // Search products
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const result = await productService.searchProducts(query);
    setIsSearching(false);

    if (result.success) {
      setSearchResults(result.products);
    } else {
      setToast({
        visible: true,
        message: result.message || 'Search failed',
        variant: 'error',
      });
    }
  }, []);

  // Check if item is in list
  const isInList = useCallback(
    (barcode) => listItems.some((item) => item.barcode === barcode),
    [listItems]
  );

  // Add product to list
  const handleAddProduct = useCallback((product) => {
    setListItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.barcode === product.barcode);

      if (existingIndex >= 0) {
        // Increment quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      // Add new item with quantity 1
      return [
        ...prev,
        {
          barcode: product.barcode,
          name: product.name,
          image_url: product.image_url,
          company: product.company,
          category: product.category,
          price: product.price,
          size: product.size,
          ingredients: product.ingredients || [],
          allergens: product.allergens || [],
          dietary_tags: product.dietary_tags || [],
          nutritional_info: product.nutritional_info || {
            calories_per_100g: 0,
            fat_per_100g: 0,
            sodium_per_100mg: 0,
            carbs_per_100g: 0,
            sugar_per_100g: 0,
            protein_per_100g: 0,
          },
          available: product.available ?? true,
          quantity: 1,
        },
      ];
    });

    setToast({
      visible: true,
      message: `Added ${product.name} to list`,
      variant: 'success',
    });
  }, []);

  // Change item quantity
  const handleQuantityChange = useCallback((item, newQuantity) => {
    if (newQuantity < 1) {
      // Remove item if quantity goes to 0
      setListItems((prev) => prev.filter((i) => i.barcode !== item.barcode));
      return;
    }

    setListItems((prev) =>
      prev.map((i) => (i.barcode === item.barcode ? { ...i, quantity: newQuantity } : i))
    );
  }, []);

  // Remove item from list
  const handleRemoveItem = useCallback((item) => {
    setListItems((prev) => prev.filter((i) => i.barcode !== item.barcode));
  }, []);

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(listItems) !== JSON.stringify(originalItems);

  // Save list
  const handleSaveList = async () => {
    if (!user?.phone) return;

    setIsSaving(true);
    const result = await shoppingListService.saveShoppingList(user.phone, listItems);
    setIsSaving(false);

    if (result.success) {
      setOriginalItems(listItems);
      setToast({
        visible: true,
        message: 'Shopping list saved!',
        variant: 'success',
      });
    } else {
      setToast({
        visible: true,
        message: result.message || 'Failed to save list',
        variant: 'error',
      });
    }
  };

  // Clear list
  const handleClearList = async () => {
    if (!user?.phone) return;

    setIsSaving(true);
    const result = await shoppingListService.saveShoppingList(user.phone, []);
    setIsSaving(false);

    if (result.success) {
      setListItems([]);
      setOriginalItems([]);
      setToast({
        visible: true,
        message: 'Shopping list cleared',
        variant: 'success',
      });
    } else {
      setToast({
        visible: true,
        message: result.message || 'Failed to clear list',
        variant: 'error',
      });
    }
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/auth/phone', { replace: true });
  };

  if (!user) {
    return null;
  }

  if (isLoadingList) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500">Loading your shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toast */}
      <Toast
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        message={toast.message}
        variant={toast.variant}
        duration={2000}
      />

      {/* Clear confirmation modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearList}
        title="Clear Shopping List"
        message="Are you sure you want to remove all items from your list?"
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Logout confirmation modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout"
        message={
          hasChanges
            ? 'You have unsaved changes. Are you sure you want to logout?'
            : 'Are you sure you want to logout?'
        }
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Icon name={ICONS.CART} size={24} fill={1} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Smart Cart</h1>
              <p className="text-xs text-gray-500">Shopping List</p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name={ICONS.LOGOUT} size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Left panel - Search */}
          <div className="lg:w-1/2 flex flex-col">
            {/* Search bar */}
            <div className="mb-4">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
                placeholder="Search for products..."
              />
            </div>

            {/* Search results */}
            <div className="flex-1 min-h-0">
              {searchQuery ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">
                    {isSearching
                      ? 'Searching...'
                      : searchResults.length > 0
                      ? `Found ${searchResults.length} product${searchResults.length !== 1 ? 's' : ''}`
                      : 'No products found'}
                  </h3>

                  <div className="space-y-2">
                    {searchResults.map((product) => (
                      <ProductCard
                        key={product.barcode}
                        product={product}
                        onAdd={handleAddProduct}
                        isInList={isInList(product.barcode)}
                      />
                    ))}
                  </div>

                  {!isSearching && searchResults.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name={ICONS.SEARCH} size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500">No products found for "{searchQuery}"</p>
                      <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name={ICONS.SEARCH} size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search Products</h3>
                  <p className="text-gray-500">
                    Type in the search box to find products
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Shopping list */}
          <div className="lg:w-1/2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-[400px] lg:min-h-0">
            <ShoppingList
              items={listItems}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
              onSave={handleSaveList}
              onClear={() => setShowClearModal(true)}
              isSaving={isSaving}
              hasChanges={hasChanges}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ListCreationPage;
