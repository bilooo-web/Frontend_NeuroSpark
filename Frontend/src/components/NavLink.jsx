import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";

const NavLink = React.forwardRef(({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
  return (
    <RouterNavLink
      ref={ref}
      to={to}
      className={({ isActive, isPending }) => {
        let classes = className || '';
        if (isActive && activeClassName) classes += ` ${activeClassName}`;
        if (isPending && pendingClassName) classes += ` ${pendingClassName}`;
        return classes;
      }}
      {...props}
    />
  );
});

NavLink.displayName = "NavLink";

export { NavLink };