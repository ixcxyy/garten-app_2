"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Check, Circle } from "lucide-react";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="surface-panel overflow-hidden rounded-[32px] p-5"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggleComplete(todo.id, todo.status)}
          className={cn(
            "mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors",
            isCompleted
              ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
              : "border-[var(--color-border)] bg-white/70 text-[var(--color-muted)]",
          )}
        >
          {isCompleted ? <Check size={18} /> : <Circle size={18} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3
              className={cn(
                "text-lg font-semibold tracking-[-0.04em]",
                isCompleted && "text-[var(--color-subtle)] line-through",
              )}
            >
              {todo.title}
            </h3>
            <span className="rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-medium text-[var(--color-brand)]">
              {isCompleted ? "Completed" : "Open"}
            </span>
          </div>

          {todo.description ? (
            <p className="mt-2 text-[15px] leading-7 text-[var(--color-muted)]">{todo.description}</p>
          ) : null}

          {todo.photo_url ? (
            <div className="mt-4 overflow-hidden rounded-[24px]">
              <Image
                src={todo.photo_url}
                alt={todo.title}
                width={640}
                height={320}
                className="h-44 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-2 text-sm text-[var(--color-subtle)]">
            <Calendar size={15} />
            <span>{new Date(todo.created_at).toLocaleDateString()}</span>
            <span className="mx-1 h-1 w-1 rounded-full bg-[var(--color-subtle)]" />
            <span>{todo.creator_name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
