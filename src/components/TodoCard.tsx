"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Todo } from "@/lib/types";
import { cn } from "@/utils/cn";

interface TodoCardProps {
  todo: Todo;
  onToggleComplete: (id: string, currentStatus: string) => void;
}

export const TodoCard = ({ todo, onToggleComplete }: TodoCardProps) => {
  const isCompleted = todo.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[var(--shadow-soft)] transition-all active:scale-[0.99]",
        isCompleted ? "border-[var(--color-border)] opacity-60" : "border-[var(--color-border)]",
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(todo.id, todo.status)}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
          isCompleted
            ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
            : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]",
        )}
      >
        {isCompleted && <Check size={13} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]",
            isCompleted && "line-through text-[var(--color-subtle)]",
          )}
        >
          {todo.title}
        </p>

        {todo.description && (
          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-muted)] line-clamp-2">
            {todo.description}
          </p>
        )}

        {todo.photo_url && (
          <div className="mt-2.5 overflow-hidden rounded-xl">
            <Image
              src={todo.photo_url}
              alt={todo.title}
              width={400}
              height={200}
              className={cn(
                "h-32 w-full object-cover",
                isCompleted && "grayscale opacity-60",
              )}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
