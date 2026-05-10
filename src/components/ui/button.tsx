import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
  loading?: boolean;
}

const variantClasses = {
  primary: "bg-[#030213] text-white hover:bg-[#1a1a3a] active:bg-[#030213] shadow-sm",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  outline: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm",
};

const sizeClasses = {
  sm: "h-7 px-2.5 text-xs rounded-md",
  md: "h-9 px-3.5 text-sm rounded-lg",
  lg: "h-10 px-5 text-sm rounded-lg",
  icon: "h-8 w-8 rounded-md flex items-center justify-center",
};

export function Button({
  variant = "secondary",
  size = "md",
  children,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors duration-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading ? (
        <>
          <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
