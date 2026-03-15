"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
};

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  src?: string | null;
  className?: string;
}

export function Avatar({ className, name, size = "md", src }: AvatarProps) {
  const initials = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.03 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative inline-flex shrink-0", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-full border-2 border-white bg-[var(--color-brand-soft)] text-center font-semibold tracking-[-0.03em] text-[var(--color-brand)] shadow-soft",
          sizeClasses[size],
        )}
      >
        {src ? (
          <img alt={name} className="h-full w-full object-cover" src={src} />
        ) : (
          <span className="flex h-full w-full items-center justify-center">{initials}</span>
        )}
      </div>
    </motion.div>
  );
}
