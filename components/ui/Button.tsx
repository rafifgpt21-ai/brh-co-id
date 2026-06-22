import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-sm",
      secondary: "bg-secondary text-on-secondary hover:bg-secondary/90 shadow-sm",
      outline: "border border-outline/30 hover:bg-surface-container-low text-on-surface transition-all",
      ghost: "hover:bg-surface-container text-on-surface-variant transition-colors",
    };
    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 py-2 px-4",
      lg: "h-11 px-8 text-lg",
    };
    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
