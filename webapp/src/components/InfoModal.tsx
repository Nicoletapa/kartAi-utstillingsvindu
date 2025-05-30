import React from "react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  descriptionTitle?: string;
  items: string[];
  closeButtonText?: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  descriptionTitle,
  items,
  closeButtonText = "Lukk",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Close when clicking on the overlay
    >
      <div
        // Removed mx-80 as it might be too specific for a reusable component,
        // consider passing width constraints as props if needed or use more general max-w classes.
        className="w-full max-w-xl scale-95 transform animate-fadeIn rounded-lg bg-white p-6 opacity-0 shadow-lg transition-all sm:max-w-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <div className="mb-8">
          <h1 className="text-xl font-medium">{title}</h1>
          {descriptionTitle && <p className="mt-2">{descriptionTitle}</p>}
          <ul className="mt-2 list-disc space-y-1 pl-7">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <button
          className="absolute bottom-4 right-4 mt-4 rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
          onClick={onClose}
        >
          {closeButtonText}
        </button>
      </div>
    </div>
  );
};
