// Tooltip.tsx
import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "right",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const placementClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${placementClasses[placement]} z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1/2 -translate-y-1/2 ${
              placement === "top"
                ? "bottom-0 left-1/2 -mb-1"
                : placement === "right"
                ? "left-0 top-1/2 -ml-1"
                : placement === "bottom"
                ? "top-0 left-1/2 -mt-1"
                : "right-0 top-1/2 -mr-1"
            }`}
          />
        </div>
      )}
    </div>
  );
};
