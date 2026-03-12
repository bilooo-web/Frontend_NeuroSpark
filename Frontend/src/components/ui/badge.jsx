import React from "react";

const Badge = ({ className, variant = "default", ...props }) => {
  // Base styles
  let variantStyles = "";
  
  switch (variant) {
    case "default":
      variantStyles = "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
      break;
    case "secondary":
      variantStyles = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
      break;
    case "destructive":
      variantStyles = "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80";
      break;
    case "outline":
      variantStyles = "text-foreground";
      break;
    default:
      variantStyles = "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles} ${
        className || ''
      }`}
      {...props}
    />
  );
};

export { Badge };