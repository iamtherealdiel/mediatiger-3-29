import React, { useState, useEffect, useRef } from "react";
import {
  UserCircle,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface NavigationItem {
  name: string;
  section: string;
  icon: React.ReactNode;
  count?: number;
  tutorialContent?: string;
}

interface SidebarProps {
  user: any;
  username: string;
  profileImage: string | null;
  uploadingImage: boolean;
  showTuto: boolean;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  navigationItems: NavigationItem[];
  setActiveSection: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  username,
  profileImage,
  uploadingImage,
  showTuto,
  handleImageUpload,
  navigationItems,
  setActiveSection,
}) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Define tutorial steps
  const tutorialSteps = [
    {
      id: "profile-section",
      title: "Your Profile",
      content:
        "This shows your profile picture and basic information. You can update your photo by clicking here.",
      position: "right",
    },
    ...navigationItems.map((item, index) => ({
      id: `nav-item-${item.section}`,
      title: item.name,
      content:
        item.tutorialContent ||
        `This is the ${
          item.name
        } section. Click here to access ${item.name.toLowerCase()} features.`,
      position: "right" as const,
    })),
  ];

  useEffect(() => {
    // Update tutorial state in Supabase when user or tutorial state changes
    const updateTutorialState = async () => {
      if (!showTuto) return;

      try {
        // Check user metadata for tutorial preference
        const showTutorialPreference = user.user_metadata?.show_tutorial;

        // Only show tutorial if it hasn't been shown before
        if (
          showTutorialPreference === undefined ||
          user.user_metadata?.show_tutorial == false
        ) {
          setShowTutorial(true);
          const { error: metadataError } = await supabase.auth.updateUser({
            data: { show_tutorial: true }, // Mark tutorial as shown
          });

          if (metadataError) {
            console.error("Error updating user metadata:", metadataError);
          }
        }
      } catch (err) {
        console.error("Failed to update tutorial state:", err);
      }
    };
    updateTutorialState();
  }, [showTuto]);
  // Update position when step changes
  useEffect(() => {
    if (!showTutorial) return;

    const updatePosition = () => {
      const element = document.getElementById(tutorialSteps[currentStep].id);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition(rect);
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    updatePosition();

    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [currentStep, showTutorial]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!elementPosition) return {};
    const position = tutorialSteps[currentStep].position || "right";
    const offset = 20;

    switch (position) {
      case "top":
        return {
          top: `${elementPosition.top - offset}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translateX(-50%) translateY(-100%)",
        };
      case "right":
        return {
          top: `${elementPosition.top + elementPosition.height / 2}px`,
          left: `${elementPosition.right + offset}px`,
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          top: `${elementPosition.bottom + offset}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          top: `${elementPosition.top + elementPosition.height / 2}px`,
          left: `${elementPosition.left - offset}px`,
          transform: "translateX(-100%) translateY(-50%)",
        };
      default:
        return {
          top: `${elementPosition.top - offset}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translateX(-50%) translateY(-100%)",
        };
    }
  };

  return (
    <>
      {/* Tutorial Overlay */}
      {showTutorial && elementPosition && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black bg-opacity-70 overflow-hidden"
        >
          {/* Highlighted element overlay */}
          <div
            className="absolute border-2 border-purple-400 rounded-md shadow-lg transition-all duration-300"
            style={{
              top: `${elementPosition.top}px`,
              left: `${elementPosition.left}px`,
              width: `${elementPosition.width}px`,
              height: `${elementPosition.height}px`,
            }}
          />

          {/* Tooltip */}
          <div
            className="absolute bg-white rounded-lg shadow-xl max-w-sm p-4 z-50"
            style={getTooltipPosition()}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">
                {tutorialSteps[currentStep].title}
              </h3>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-gray-500 hover:text-gray-700 ml-2"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-700 mb-4">
              {tutorialSteps[currentStep].content}
            </p>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {tutorialSteps.length}
              </div>
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  {currentStep === tutorialSteps.length - 1 ? (
                    "Finish"
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-slate-800">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* User Profile Summary */}
            <div id="profile-section" className="px-6 py-8 text-center">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-indigo-600 mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold relative overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.user_metadata?.full_name?.[0]?.toUpperCase() || (
                      <UserCircle className="h-16 w-16" />
                    )
                  )}

                  {/* Upload overlay */}
                  <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : (
                      <span className="text-white text-sm">Update</span>
                    )}
                  </label>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">
                Welcome,{" "}
                {user?.user_metadata?.full_name?.split(" ")[0] || "User"}!
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                {username && <span>@{username}</span>}
              </p>
            </div>

            <nav className="mt-5 flex-1 space-y-2 px-4">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  id={`nav-item-${item.section}`}
                  onClick={() => {
                    setActiveSection(item.section);
                    if (showTutorial) {
                      const stepIndex = tutorialSteps.findIndex(
                        (step) => step.id === `nav-item-${item.section}`
                      );
                      if (stepIndex !== -1) setCurrentStep(stepIndex);
                    }
                  }}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300 relative overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02] hover:-translate-y-0.5
                    ${
                      showTutorial &&
                      currentStep ===
                        tutorialSteps.findIndex(
                          (step) => step.id === `nav-item-${item.section}`
                        )
                        ? "ring-2 ring-yellow-400"
                        : ""
                    }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center">
                    <span className="transform transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span className="ml-3 transform transition-transform duration-300 group-hover:translate-x-1">
                      {item.name}
                    </span>
                  </div>
                  {item.count && (
                    <span className="relative z-10 ml-auto bg-slate-900 py-0.5 px-2 rounded-full text-xs transform transition-all duration-300 group-hover:bg-indigo-900 group-hover:text-white">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Tutorial Trigger Button */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
