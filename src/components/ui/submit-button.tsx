/**
 * SubmitButton Component
 * 
 * A button component specifically designed for form submissions that
 * prevents accidental rendering of toast return values by ensuring
 * proper event handling.
 */

import React from "react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Safe submit button that prevents toast-related rendering errors
 * by properly handling click events and preventing default form submission.
 */
const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  onClick, 
  children,
  disabled = false,
  variant,
  size,
  className,
  ...props 
}) => {
  // Safely handle click by preventing default behavior and
  // stopping event propagation to avoid unintended form submissions
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    // Execute the callback but ensure we don't return any value
    try {
      // Call the onClick handler but don't use its return value
      onClick();
    } catch (error) {
      console.error("Error in button click handler:", error);
    }
  };
  
  return (
    <Button 
      onClick={handleClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
};

export default SubmitButton; 