/**
 * Tool Call Messages Configuration
 * 
 * Maps tool call names to their corresponding loading messages.
 * These messages are displayed in the chat bubble with a shimmer effect
 * while the tool is executing, before the final result is shown.
 * 
 * If a tool is not listed here, no loading message will be displayed.
 */

export const TOOL_CALL_MESSAGES = {
  get_ai_alternatives: "Searching for suitable alternatives...",
  get_nutrition_details: "Reading product information...",
  get_product_info: "Searching for the product location...",
};

/**
 * Get the loading message for a specific tool call
 * @param {string} toolName - The name of the tool being called
 * @returns {string|null} The loading message or null if not configured
 */
export function getToolCallMessage(toolName) {
  return TOOL_CALL_MESSAGES[toolName] || null;
}

