"use client";

import React, { useState } from "react";

const ProgressBar = () => {
  const steps = ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"];
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = Math.round((currentStep / (steps.length - 1)) * 100);
  const progressWidth = `${progressPercentage}%`;

  return (
    <div className="flex flex-col h-screen">
      {/* Progress Bar */}
      <div className="w-full px-6 mt-10">
        <div className="relative h-4 bg-gray-200 rounded-full mx-4">
          <div
            className="absolute h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: progressWidth }}
          >
            <div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-blue-500"
              style={{ left: progressWidth }}
            >
              {progressPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow"></div>

      {/* Buttons at the Bottom */}
      <div className="fixed inset-x-9 bottom-2 shadow-t px-4 py-6">
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={currentStep === 0}
          >
            Tilbake
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={currentStep === steps.length - 1}
          >
            Neste
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;

