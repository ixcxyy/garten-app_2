"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera } from "lucide-react";
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
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-[var(--color-panel)] transition-opacity",
        isCompleted ? "opacity-55" : "opacity-100",
      )}
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: isCompleted
          ? "none"
          : "0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top bar accent when not completed */}
      {!isCompleted && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
          style={{ background: "var(--color-brand)", opacity: 0.6 }}
        />
      )}

      <div className="flex items-start gap-3.5 px-4 py-4 pl-5">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(todo.id, todo.status)}
          className="mt-0.5 shrink-0 flex h-[26px] w-[26px] items-center justify-center rounded-full transition-all duration-200 active:scale-90"
          style={{
            border: isCompleted
              ? "2px solid var(--color-brand)"
              : "2px solid var(--color-border-strong)",
            background: isCompleted ? "var(--color-brand)" : "transparent",
          }}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check size={13} strokeWidth={3} color="white" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[15px] font-semibold leading-snug tracking-tight",
              isCompleted
                ? "line-through text-[var(--color-subtle)]"
                : "text-[var(--color-foreground)]",
            )}
          >
            {todo.title}
          </p>

          {todo.description && (
            <p
              className="mt-1 text-[13px] leading-relaxed line-clamp-2"
              style={{ color: "var(--color-muted)" }}
            >
              {todo.description}
            </p>
          )}

          {todo.photo_url && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 overflow-hidden rounded-[14px]"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div className="relative">
                <Image
                  src={todo.photo_url}
                  alt={todo.title}
                  width={400}
                  height={200}
                  className={cn(
                    "h-40 w-full object-cover transition-all duration-300",
                    isCompleted && "grayscale opacity-50",
                  )}
                />
                <div
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-1"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
                >
                  <Camera size={10} color="white" strokeWidth={2} />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Foto</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
