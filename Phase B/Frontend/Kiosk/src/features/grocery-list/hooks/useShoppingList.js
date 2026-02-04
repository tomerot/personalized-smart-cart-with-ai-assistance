import { useState, useCallback } from "react";
import { shoppingListService } from "@/services/shoppingListService";

/**
 * Custom hook to manage shopping list state and operations
 */
export function useShoppingList({ user, cartItemsMap }) {
  const [shoppingList, setShoppingList] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [skippedItems, setSkippedItems] = useState(new Set());

  // Toggle skip status for an item
  const handleToggleSkip = useCallback((barcode) => {
    setSkippedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(barcode)) {
        newSet.delete(barcode);
      } else {
        newSet.add(barcode);
      }
      return newSet;
    });
  }, []);

  // Load shopping list from backend
  const handleLoadGroceryList = async () => {
    if (!user?.phone || isLoadingList) return;
    
    setIsLoadingList(true);

    try {
      const result = await shoppingListService.getShoppingList(user.phone);
      
      if (result.success && result.data?.items?.length > 0) {
        // Store the shopping list in state
        setShoppingList(result.data);
        setSkippedItems(new Set()); // Reset skipped items
      } else {
        setShoppingList(null);
      }
    } catch (error) {
      console.error("Failed to load grocery list:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Check if there are uncollected items from shopping list
  const hasUncollectedItems = useCallback(() => {
    if (!shoppingList?.items?.length) return false;

    return shoppingList.items.some(item => {
      // Skip items that user marked as skipped (not to take)
      if (skippedItems?.has(item.barcode)) return false;

      const collectedQty = cartItemsMap.get(item.barcode) || 0;
      // If they still need to collect some of this item
      return collectedQty < item.quantity;
    });
  }, [shoppingList, skippedItems, cartItemsMap]);

  // Determine if list is loaded
  const isListLoaded = shoppingList !== null && shoppingList.items?.length > 0;

  return {
    shoppingList,
    isLoadingList,
    skippedItems,
    isListLoaded,
    handleToggleSkip,
    handleLoadGroceryList,
    hasUncollectedItems,
  };
}

