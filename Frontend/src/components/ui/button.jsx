import React from "react";
import { Slot } from "@radix-ui/react-slot";

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  
  // Base styles
  let variantStyles = "";
  let sizeStyles = "";
  
  // Variant styles
  switch (variant) {
    case "default":
      variantStyles = "bg-primary text-primary-foreground hover:bg-primary/90";
      break;
    case "destructive":
      variantStyles = "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      break;
    case "outline":
      variantStyles = "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
      break;
    case "secondary":
      variantStyles = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
      break;
    case "ghost":
      variantStyles = "hover:bg-accent hover:text-accent-foreground";
      break;
    case "link":
      variantStyles = "text-primary underline-offset-4 hover:underline";
      break;
    default:
      variantStyles = "bg-primary text-primary-foreground hover:bg-primary/90";
  }
  
  // Size styles
  switch (size) {
    case "default":
      sizeStyles = "h-10 px-4 py-2";
      break;
    case "sm":
      sizeStyles = "h-9 rounded-md px-3";
      break;
    case "lg":
      sizeStyles = "h-11 rounded-md px-8";
      break;
    case "icon":
      sizeStyles = "h-10 w-10";
      break;
    default:
      sizeStyles = "h-10 px-4 py-2";
  }
  
  return (
    <Comp
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${variantStyles} ${sizeStyles} ${
        className || ''
      }`}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };