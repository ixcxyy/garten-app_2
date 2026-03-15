"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Check, Circle } from "lucide-react";
import { Todo } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";
import { getProfileDisplayName } from "@/lib/utils";

interface TodoCardProps {
  todo: Todo;
  onToggleComplete: (id: string, currentStatus: string) => void;
}

export const TodoCard = ({ todo, onToggleComplete }: TodoCardProps) => {
  const isCompleted = todo.status === "completed";
  const creatorName = getProfileDisplayName(todo.user_profile);

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
            "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            isCompleted
              ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-soft"
              : "border-[var(--color-border)] bg-white/70 text-[var(--color-muted)] hover:border-[var(--color-brand)]",
          )}
        >
          {isCompleted ? <Check size={18} strokeWidth={3} /> : <Circle size={18} strokeWidth={2} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "text-[17px] font-bold tracking-tight text-[var(--color-foreground)] transition-colors",
                isCompleted && "text-[var(--color-subtle)] line-through opacity-70",
              )}
            >
              {todo.title}
            </h3>
          </div>

          {todo.description && (
            <p className={cn(
              "mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]",
              isCompleted && "opacity-60"
            )}>
              {todo.description}
            </p>
          )}

          {todo.photo_url && (
            <div className="mt-4 overflow-hidden rounded-[20px] shadow-soft">
              <Image
                src={todo.photo_url}
                alt={todo.title}
                width={640}
                height={360}
                className={cn(
                  "h-48 w-full object-cover transition-transform duration-500 hover:scale-105",
                  isCompleted && "grayscale opacity-80"
                )}
              />
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--color-subtle)]">
              <Calendar size={14} strokeWidth={2.5} />
              <span>{new Date(todo.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[var(--color-muted)]">
                {creatorName}
              </span>
              <Avatar name={creatorName} size="sm" src={todo.user_profile?.avatar_url} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
