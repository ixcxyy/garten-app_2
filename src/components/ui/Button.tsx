"use client";

import { motion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "glass";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#111111_0%,#2a2a2a_100%)] text-white shadow-[0_16px_40px_rgba(17,17,17,0.16)] hover:shadow-[0_20px_48px_rgba(17,17,17,0.22)]",
  secondary:
    "border border-stroke-strong bg-white/80 text-foreground hover:bg-white",
  ghost:
    "text-foreground hover:bg-white/70",
  glass:
    "border border-white/60 bg-white/55 text-foreground backdrop-blur-[20px] hover:bg-white/72",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { y: -1.5, scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[18px] font-medium tracking-[-0.02em] outline-none transition-all focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55",
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
