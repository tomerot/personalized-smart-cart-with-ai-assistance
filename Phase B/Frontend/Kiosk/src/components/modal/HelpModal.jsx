import { useEffect, useState } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons.config";

// Import help images
import helpImg1 from "@/assets/help_imgs/1.jpg";
import helpImg2 from "@/assets/help_imgs/2.jpg";
import helpImg3 from "@/assets/help_imgs/3.jpg";
import helpImg4 from "@/assets/help_imgs/4.jpg";
import helpImg5 from "@/assets/help_imgs/5.jpg";
import helpImg6 from "@/assets/help_imgs/6.jpg";
import helpImg7 from "@/assets/help_imgs/7.jpg";
import helpImg8 from "@/assets/help_imgs/8.jpg";

// Help pages data - placeholder text for now
const HELP_PAGES = [
  {
    image: helpImg1,
    title: "Add Products to Your Cart",
    explanation: (
      <>
        You can add products to your cart by pointing the product's barcode toward
        <br />
        the scanner and pressing its button, or by entering the barcode manually by
        <br />
        tapping "Type Barcode", typing the number, and pressing OK. Manual entry is
        <br />
        useful if the barcode cannot be scanned.
      </>
    ),
  },
  {
    image: helpImg2,
    title: "Follow Your Shopping List",
    explanation: (
      <>
        You can create a shopping list in advance using the app and load it when you
        <br />
        arrive at the store. After loading your list, products added to your cart are
        <br />
        automatically marked as completed, products you decide to skip can be marked
        <br />
        as not needed, and the Next Stop highlights the next products to pick up,
        <br />
        helping you easily track the progress.
      </>
    ),
  },
  {
    image: helpImg3,
    title: "Shopping Route",
    explanation: (
      <>
        Based on your shopping list, the cart shows a recommended route through the
        <br />
        store and updates it as you collect products.
      </>
    ),
  },
  {
    image: helpImg4,
    title: "Smart Companion: Ask About Products",
    explanation: (
      <>
        You can ask questions about the product currently highlighted in your cart.
        <br />
        The Smart Companion can provide information such as nutritional values or
        <br />
        ingredient details to help you make informed choices.
      </>
    ),
  },
  {
    image: helpImg5,
    title: "Smart Companion: Find Product Alternatives",
    explanation: (
      <>
        You can ask the Smart Companion to suggest alternatives for the product
        <br />
        currently highlighted in your cart. The alternatives are provided based on the
        <br />
        requirements you mention, as well as your allergies, dietary needs, and
        <br />
        product availability.
      </>
    ),
  },
  {
    image: helpImg6,
    title: "Smart Companion: Find Product Location",
    explanation: (
      <>
        You can ask the Smart Companion to show you where a product is located in
        <br />
        the store. If the product is not currently available, the Smart Companion will
        <br />
        let you know instead of showing a location.
      </>
    ),
  },
  {
    image: helpImg7,
    title: "Smart Companion: Allergy & Dietary Alerts",
    explanation: (
      <>
        You can ask the Smart Companion to automatically alert you when a product
        <br />
        you add to your cart conflicts with specific allergies or dietary needs you have.
        <br />
        If suitable alternatives are available, matching products are suggested
        <br />
        automatically. You can ask the Smart Companion to stop these alerts at any
        <br />
        time. Your current allergies and dietary needs can always be reviewed under
        <br />
        the Profile section.
      </>
    ),
  },
  {
    image: helpImg8,
    title: "Frequently Bought Product Suggestions",
    explanation: (
      <>
        Based on your past shopping behavior, the system predicts products you may
        <br />
        need but have not added to your cart. These products are suggested before
        <br />
        checkout to help you avoid forgetting them.
      </>
    ),
  },
];

/**
 * HelpModal Component
 *
 * A multi-page help modal with navigation arrows to switch between pages.
 * Each page has an image at the top and a title/explanation at the bottom.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 */
const HelpModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset to first page when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < HELP_PAGES.length - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === HELP_PAGES.length - 1;

  if (!isOpen) return null;

  const currentHelpPage = HELP_PAGES[currentPage];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Navigation container with arrows outside the modal */}
      <div className="relative flex items-center gap-6">
        {/* Left Arrow Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevPage();
          }}
          disabled={isFirstPage}
          className={`flex items-center justify-center
                     w-14 h-14 rounded-full
                     transition-all duration-150
                     shrink-0 z-10
                     ${isFirstPage 
                       ? 'bg-black opacity-30 cursor-not-allowed' 
                       : 'bg-black hover:bg-gray-800 active:bg-gray-900 cursor-pointer opacity-100'}`}
          aria-label="Previous page"
        >
          <Icon
            name={ICONS.LEFT}
            size={32}
            weight={500}
            style={{ color: "white" }}
          />
        </button>

        {/* Modal container */}
        <div
          className="relative flex flex-col
                     w-[min(750px,85vw)] max-h-[85vh]
                     rounded-3xl shadow-2xl bg-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - top left inside black circle */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10
                       flex items-center justify-center
                       w-10 h-10 rounded-full
                       bg-black hover:bg-gray-800 active:bg-gray-900
                       transition-colors duration-150
                       cursor-pointer"
            aria-label="Close modal"
          >
            <Icon
              name={ICONS.CLOSE}
              size={24}
              weight={500}
              style={{ color: "white" }}
            />
          </button>

          {/* Image section - top of modal */}
          <div className="w-full overflow-hidden">
            <img
              src={currentHelpPage.image}
              alt={`Help page ${currentPage + 1}`}
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Divider line */}
          <div className="w-full border-t border-gray-200" />

          {/* Content section - bottom of modal */}
          <div 
            className="flex flex-col items-center p-6"
            style={{
              background: 'linear-gradient(to top, #e4fcec, white)'
            }}
          >
            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              {currentHelpPage.title}
            </h2>

            {/* Explanation */}
            <div className="text-base text-gray-600 text-center leading-relaxed w-full">
              {currentHelpPage.explanation}
            </div>
          </div>
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
          disabled={isLastPage}
          className={`flex items-center justify-center
                     w-14 h-14 rounded-full
                     transition-all duration-150
                     shrink-0 z-10
                     ${isLastPage 
                       ? 'bg-black opacity-30 cursor-not-allowed' 
                       : 'bg-black hover:bg-gray-800 active:bg-gray-900 cursor-pointer opacity-100'}`}
          aria-label="Next page"
        >
          <Icon
            name={ICONS.RIGHT}
            size={32}
            weight={500}
            style={{ color: "white" }}
          />
        </button>
      </div>
    </div>
  );
};

export default HelpModal;

