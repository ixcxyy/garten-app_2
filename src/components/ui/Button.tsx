"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-white shadow-soft hover:bg-[var(--color-brand-strong)]",
  secondary:
    "bg-white border border-[var(--color-border)] text-[var(--color-foreground)] shadow-soft hover:bg-[var(--color-canvas)]",
  ghost:
    "bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { y: -1 }}
        whileTap={disabled ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(
          "inline-flex min-w-[44px] items-center justify-center rounded-[var(--radius-pill)] font-medium tracking-[-0.02em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
