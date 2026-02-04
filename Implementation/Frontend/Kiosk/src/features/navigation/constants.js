import { ICONS } from "@/components/icons/icons.config";

/**
 * Navigation view identifiers
 */
export const NAV_VIEWS = {
  GROCERY_LIST: "groceryList",
  COMPANION: "companion",
  DISCOUNTS: "discounts",
};

/**
 * Configuration for each navigation view
 * Includes display information and action buttons
 */
export const VIEW_CONFIG = {
  [NAV_VIEWS.GROCERY_LIST]: {
    icon: ICONS.GROCERY_LIST,
    label: "Grocery List",
    actionButton: {
      icon: ICONS.LOAD_LIST,
      label: "Load Grocery List",
    },
  },
  [NAV_VIEWS.COMPANION]: {
    icon: ICONS.CHAT,
    label: "Smart Companion",
    actionButton: {
      icon: ICONS.AUDIO,
      label: "Audio Settings",
    },
  },
  [NAV_VIEWS.DISCOUNTS]: {
    icon: ICONS.DISCOUNT,
    label: "Discounts",
    // No action button for discounts view
  },
};

