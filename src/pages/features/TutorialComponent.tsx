import React, { useState } from "react";
import { X } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export const TutorialComponent: React.FC<TutorialProps> = ({
  isOpen,
  onClose,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to MediaTiger!",
      description:
        "Let us guide you through the main features of your dashboard.",
    },
    {
      title: "Your Profile",
      description:
        "Update your profile information and notification preferences here.",
      target: ".profile-section",
    },
    {
      title: "Monthly Goals",
      description: "Set and track your monthly goals to measure your progress.",
      target: ".goals-section",
    },
    {
      title: "Analytics",
      description: "View detailed analytics about your channel performance.",
      target: ".analytics-section",
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 relative border border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 text-indigo-400">
              {/* You can add different icons for each step */}
              📚
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {tutorialSteps[currentStep].title}
          </h2>
          <p className="text-slate-300 text-center">
            {tutorialSteps[currentStep].description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-indigo-500" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
