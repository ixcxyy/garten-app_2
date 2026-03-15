"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-3" htmlFor={inputId}>
        {label ? (
          <span className="text-sm font-medium tracking-[-0.02em] text-foreground">
            {label}
          </span>
        ) : null}

        <div
          className={cn(
            "group flex h-14 items-center gap-3 rounded-[20px] border bg-white/82 px-4 transition-all",
            error
              ? "border-[#e7b5b5] focus-within:border-[#db8f8f]"
              : "border-stroke-soft focus-within:border-sky/45",
            "focus-within:shadow-focus",
          )}
        >
          {prefix ? <span className="text-ink-faint">{prefix}</span> : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-full w-full border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-ink-faint",
              className,
            )}
            {...props}
          />
          {suffix ? <span className="text-ink-faint">{suffix}</span> : null}
        </div>

        {error ? (
          <span className="text-sm text-[#b45f5f]">{error}</span>
        ) : hint ? (
          <span className="text-sm text-ink-soft">{hint}</span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
