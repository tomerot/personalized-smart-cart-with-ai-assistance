import ProductAlternatives from "./ProductAlternatives";
import { formatAllergyNames, formatDietaryNeedNames } from "@/utils/formatters";

/**
 * ConflictAlternativesContent Component
 *
 * Displays conflict information with dietary/allergen tags and product alternatives.
 * Used inside ChatBubble when a scanned product conflicts with user preferences.
 * 
 * Note: This component is for scan conflicts only (immediate display).
 * For voice assistant alternatives requests, ProductAlternatives is used directly.
 *
 * @param {string} message - The main conflict message text
 * @param {Array<string>} allergenConflicts - List of allergen names that conflict
 * @param {Array<string>} dietaryConflicts - List of dietary needs that conflict
 * @param {Array<object>} alternatives - Array of alternative products
 * @param {function} onReplace - Callback when "Replace" button is clicked
 * @param {boolean} disabled - Whether replace buttons should be disabled
 */
const ConflictAlternativesContent = ({
  message = "I found a conflict with at least one of your dietary needs or allergies:",
  allergenConflicts = [],
  dietaryConflicts = [],
  alternatives = [],
  onReplace,
  disabled = false,
}) => {
  // Combine all conflict tags with formatted display names
  const formattedAllergenConflicts = formatAllergyNames(allergenConflicts);
  const formattedDietaryConflicts = formatDietaryNeedNames(dietaryConflicts);
  
  const allConflicts = [
    ...formattedAllergenConflicts.map((name, index) => ({ type: 'allergen', name, originalKey: allergenConflicts[index] })),
    ...formattedDietaryConflicts.map((name, index) => ({ type: 'dietary', name, originalKey: dietaryConflicts[index] })),
  ];

  // Transform alternatives to the format expected by ProductAlternatives
  const transformedAlternatives = alternatives.map(product => ({
    id: product.barcode,
    name: product.name,
    size: product.size,
    company: product.company,
    price: product.price,
    imageUrl: product.image_url,
    // Keep original product data for replace action
    originalProduct: product,
  }));

  return (
    <div className="space-y-4">
      {/* Conflict Message */}
      <p className="text-base font-normal">{message}</p>

      {/* Conflict Tags */}
      {allConflicts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allConflicts.map((conflict, index) => (
            <span
              key={`${conflict.type}-${conflict.name}-${index}`}
              className={`
                inline-flex items-center
                px-3 py-1.5
                rounded-full
                text-sm font-medium
                ${conflict.type === 'allergen'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-orange-100 text-orange-700 border border-orange-200'
                }
              `}
            >
              {conflict.type === 'allergen' && (
                <span className="mr-1.5">⚠️</span>
              )}
              {conflict.name}
            </span>
          ))}
        </div>
      )}

      {/* Alternatives */}
      {transformedAlternatives.length > 0 && (
        <ProductAlternatives
          alternatives={transformedAlternatives}
          onReplace={onReplace}
          disabled={disabled}
        />
      )}

      {/* No Alternatives Message */}
      {alternatives.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No suitable alternatives found for this product.
        </p>
      )}
    </div>
  );
};

export default ConflictAlternativesContent;

