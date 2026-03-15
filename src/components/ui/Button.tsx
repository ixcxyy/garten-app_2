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
    "bg-[var(--color-fab-bg)] text-[var(--color-fab-fg)] shadow-soft hover:opacity-90",
  secondary:
    "border border-[var(--color-border-strong)] text-[var(--color-foreground)] shadow-soft hover:bg-[var(--color-interactive-bg)]",
  ghost:
    "bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-interactive-bg)] hover:text-[var(--color-foreground)]",
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
          "inline-flex min-w-[44px] items-center justify-center rounded-full font-semibold tracking-[-0.02em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-40",
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
