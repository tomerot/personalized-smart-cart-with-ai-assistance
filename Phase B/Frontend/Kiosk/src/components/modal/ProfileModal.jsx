import { useEffect } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";
import { useUser } from "@/context/UserContext";

/**
 * ProfileModal Component
 *
 * Displays user profile information including phone number, allergies, and dietary needs
 * Styled similarly to ForgotItemsModal with dark backdrop and blur effect
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 */
const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useUser();

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Don't show modal if not open or no user
  if (!isOpen || !user) return null;

  // Format phone number from +9725XXXXXXXX to 05X-XXXXXXX
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    // Remove +972 prefix and add 0 prefix, then format as 05X-XXXXXXX
    const cleaned = phone.replace(/^\+972/, "0");
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const formattedPhone = formatPhoneNumber(user.phone);
  const allergies = user.allergies || [];
  const dietaryNeeds = user.dietary_needs || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        className="relative flex flex-col
                   w-[min(500px,95vw)] max-h-[85vh]
                   rounded-2xl shadow-2xl bg-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center p-5 border-b border-gray-200 relative">
          <h2 className="text-xl font-semibold text-gray-800">
            Profile
          </h2>
          <button
            onClick={onClose}
            className="absolute right-5 p-1 hover:opacity-70 active:opacity-50 transition-opacity"
            aria-label="Close modal"
          >
            <Icon
              name={ICONS.CLOSE}
              size={28}
              weight={500}
              style={{ color: "#374151" }}
            />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0">
            {/* Phone Number */}
            <div className="flex flex-col items-center py-6">
              <div className="flex items-center gap-3">
                <Icon
                  name={ICONS.PHONE}
                  size={32}
                  weight={400}
                  style={{ color: "#374151" }}
                />
                <span className="text-3xl font-bold text-gray-800 tabular-nums">
                  {formattedPhone}
                </span>
              </div>
            </div>

            {/* Divider with same padding as content below */}
            <div className="px-6">
              <div className="border-b border-gray-200"></div>
            </div>

            {/* Allergies and Dietary Needs */}
            <div className="p-6 space-y-6">
              {/* Allergies Section */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Icon
                    name={ICONS.CONFLICT}
                    size={22}
                    weight={500}
                    style={{ color: "#000000" }}
                  />
                  <h3 className="text-lg font-semibold text-gray-700">
                    Allergies
                  </h3>
                </div>
                {allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {allergies.map((allergen, index) => (
                      <span
                        key={`allergen-${allergen}-${index}`}
                        className="inline-flex items-center
                                  px-3 py-1.5
                                  rounded-full
                                  text-sm font-medium
                                  bg-red-100 text-red-700 border border-red-200"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 text-sm italic">
                    No allergies recorded
                  </p>
                )}
              </div>

              {/* Dietary Needs Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon
                    name={ICONS.NUTRITION}
                    size={22}
                    weight={500}
                    style={{ color: "#000000" }}
                  />
                  <h3 className="text-lg font-semibold text-gray-700">
                    Dietary Needs
                  </h3>
                </div>
                {dietaryNeeds.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {dietaryNeeds.map((dietary, index) => (
                      <span
                        key={`dietary-${dietary}-${index}`}
                        className="inline-flex items-center
                                  px-3 py-1.5
                                  rounded-full
                                  text-sm font-medium
                                  bg-orange-100 text-orange-700 border border-orange-200"
                      >
                        {dietary}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 text-sm italic">
                    No dietary needs recorded
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your preferences help us provide better recommendations and alerts
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

