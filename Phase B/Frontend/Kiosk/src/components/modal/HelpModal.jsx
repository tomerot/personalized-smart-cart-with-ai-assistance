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
        You can add products to your cart in two ways:
        <br /><br />
        • Point the product's barcode toward the scanner and press its button
        <br />
        • Enter the barcode manually by tapping "Type Barcode", entering the
        <br />
        &nbsp;&nbsp;number, and pressing OK
        <br /><br />
        Use manual entry if the barcode cannot be scanned.
      </>
    ),
  },
  {
    image: helpImg2,
    title: "Title",
    explanation: "Explanation",
  },
  {
    image: helpImg3,
    title: "Title",
    explanation: "Explanation",
  },
  {
    image: helpImg4,
    title: "Title",
    explanation: "Explanation",
  },
  {
    image: helpImg5,
    title: "Title",
    explanation: "Explanation",
  },
  {
    image: helpImg6,
    title: "Title",
    explanation: "Explanation",
  },
  {
    image: helpImg7,
    title: "Title",
    explanation: "Explanation",
  },
  {
    image: helpImg8,
    title: "Title",
    explanation: "Explanation",
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
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : HELP_PAGES.length - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < HELP_PAGES.length - 1 ? prev + 1 : 0));
  };

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
          className="flex items-center justify-center
                     w-14 h-14 rounded-full
                     bg-black hover:bg-gray-800 active:bg-gray-900
                     transition-colors duration-150
                     cursor-pointer shrink-0 z-10"
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
                     w-[min(650px,85vw)] max-h-[85vh]
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
          <div className="w-full bg-gray-100 overflow-hidden">
            <img
              src={currentHelpPage.image}
              alt={`Help page ${currentPage + 1}`}
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Divider line */}
          <div className="w-full border-t border-gray-200" />

          {/* Content section - bottom of modal */}
          <div className="flex flex-col items-center p-6">
            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              {currentHelpPage.title}
            </h2>

            {/* Explanation */}
            <div className="text-base text-gray-600 text-left leading-relaxed w-full">
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
          className="flex items-center justify-center
                     w-14 h-14 rounded-full
                     bg-black hover:bg-gray-800 active:bg-gray-900
                     transition-colors duration-150
                     cursor-pointer shrink-0 z-10"
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

