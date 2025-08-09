// src/components/common/LoadingSpinner.js
import React from "react";

const LoadingSpinner = ({
  size = "default",
  text = "Loading...",
  fullScreen = false,
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12",
    xlarge: "h-16 w-16",
  };

  const textSizes = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg",
    xlarge: "text-xl",
  };

  const Spinner = () => (
    <div className={`inline-flex items-center ${fullScreen ? "flex-col" : ""}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} text-primary-600`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <span
          className={`ml-2 text-secondary-600 ${textSizes[size]} ${
            fullScreen ? "mt-4" : ""
          }`}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <Spinner />
      </div>
    );
  }

  return <Spinner />;
};

export default LoadingSpinner;
