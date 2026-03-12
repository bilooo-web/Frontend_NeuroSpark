import React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

const Toggle = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-transparent",
    outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  }[variant];

  const sizeStyles = {
    default: "h-10 px-3",
    sm: "h-9 px-2.5",
    lg: "h-11 px-5",
  }[size];

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${variantStyles} ${sizeStyles} ${
        className || ''
      }`}
      {...props}
    />
  );
});
Toggle.displayName = "Toggle";

export { Toggle };