"use client";

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
        <span className="text-sm font-medium tracking-[-0.02em]" style={{ color: "var(--color-muted)" }}>
          {label}
        </span>
      ) : null}

      <div className="relative">
        <input
          className={cn(
            "h-[52px] w-full rounded-xl px-4 text-[15px] transition-all outline-none",
            className,
          )}
          style={{
            background: isFocused ? "var(--color-panel)" : "var(--color-interactive-bg)",
            border: isFocused
              ? "1px solid var(--color-border-highlight)"
              : "1px solid var(--color-border-strong)",
            color: "var(--color-foreground)",
          }}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          {...props}
        />
      </div>

      {hint ? <p className="text-xs" style={{ color: "var(--color-subtle)" }}>{hint}</p> : null}
    </label>
  );
}
