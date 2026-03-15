"use client";

import { motion } from "framer-motion";
import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-medium tracking-[-0.02em] text-[var(--color-muted)]">
          {label}
        </span>
      ) : null}

      <div className="relative">
        <input
          className={cn(
            "h-[52px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white/70 px-4 text-[15px] text-[var(--color-foreground)] shadow-[var(--shadow-soft)] transition-all placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white",
            className,
          )}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          {...props}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)] border border-[var(--color-brand)]"
          initial={false}
          animate={{ opacity: isFocused ? 0.14 : 0, scale: isFocused ? 1 : 0.99 }}
        />
      </div>

      {hint ? <p className="text-xs text-[var(--color-subtle)]">{hint}</p> : null}
    </label>
  );
}
