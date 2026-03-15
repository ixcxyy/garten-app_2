"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -4 } : undefined}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "surface-panel rounded-[var(--radius-lg)] p-6 text-[var(--color-foreground)]",
          interactive && "cursor-pointer",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
