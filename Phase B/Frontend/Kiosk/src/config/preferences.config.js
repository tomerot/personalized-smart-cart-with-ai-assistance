/**
 * User Preferences Display Configuration
 * 
 * Maps database allergy and dietary need values to their display names.
 * Used by formatter functions in utils/formatters.js
 */

/**
 * Allergy display names mapping
 * Key: Database value (as stored in backend)
 * Value: Display name (as shown to users)
 */
export const ALLERGY_DISPLAY_NAMES = {
  'sesame': 'Sesame',
  'peanuts': 'Peanuts',
  'tree-nuts': 'Tree Nuts',
  'dairy': 'Dairy',
  'eggs': 'Eggs',
  'soy': 'Soy'
};

/**
 * Dietary needs display names mapping
 * Key: Database value (as stored in backend)
 * Value: Display name (as shown to users)
 */
export const DIETARY_NEEDS_DISPLAY_NAMES = {
  'vegan': 'Vegan',
  'vegetarian': 'Vegetarian',
  'gluten-free': 'Gluten Free',
  'lactose-free': 'Lactose Free',
  'sugar-free': 'Sugar Free',
  'low-sodium': 'Low Sodium',
  'low-carb': 'Low Carb',
  'high-protein': 'High Protein'
};

