import React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { Toggle } from "./toggle";

const ToggleGroup = React.forwardRef(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={`flex items-center justify-center gap-1 ${className || ''}`} {...props} />
));
ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <ToggleGroupPrimitive.Item ref={ref} className={`${className || ''}`} {...props}>
      <Toggle>{children}</Toggle>
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };