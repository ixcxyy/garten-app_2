"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";
type AvatarStatus = "online" | "away" | "offline";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
};

const statusClasses: Record<AvatarStatus, string> = {
  online: "bg-sage",
  away: "bg-peach",
  offline: "bg-black/18",
};

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  src?: string;
}

export function Avatar({
  className,
  name,
  size = "md",
  status,
  src,
  ...props
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.03 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative inline-flex shrink-0", className)}
      {...props}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#ebe8e0_100%)] text-center font-semibold tracking-[-0.03em] text-foreground shadow-[0_14px_30px_rgba(15,23,42,0.12)]",
          sizeClasses[size],
        )}
      >
        {src ? (
          <img alt={name} className="h-full w-full object-cover" src={src} />
        ) : (
          <span className="flex h-full w-full items-center justify-center">{initials}</span>
        )}
      </div>
      {status ? (
        <span
          className={cn(
            "absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white",
            statusClasses[status],
          )}
        />
      ) : null}
    </motion.div>
  );
}
