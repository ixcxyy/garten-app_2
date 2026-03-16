"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, Calendar, Hand, SmilePlus } from "lucide-react";
import { Todo, TaskReaction, UserProfile } from "@/lib/types";
import { cn } from "@/utils/cn";

const EMOJI_OPTIONS = ["👍", "❤️", "🌱", "💪", "🎉", "👏"];

interface TodoCardProps {
  todo: Todo;
  onToggleComplete: (id: string, currentStatus: string) => void;
  currentUserId?: string;
  assignees?: { user_id: string; user_profile?: UserProfile }[];
  reactions?: TaskReaction[];
  onAssign?: () => void;
  onUnassign?: () => void;
  onReact?: (emoji: string) => void;
  onUnreact?: (emoji: string) => void;
  isAssigned?: boolean;
  isDemoMode?: boolean;
}

export const TodoCard = ({
  todo,
  onToggleComplete,
  currentUserId,
  assignees = [],
  reactions = [],
  onAssign,
  onUnassign,
  onReact,
  onUnreact,
  isAssigned = false,
}: TodoCardProps) => {
  const isCompleted = todo.status === "completed";
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const reactionGroups = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});

  return (
    <motion.div
      layout="position"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "relative overflow-hidden rounded-[22px] bg-[var(--color-panel)]",
        isCompleted ? "opacity-60" : "opacity-100",
      )}
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: isCompleted
          ? "none"
          : "0 2px 12px -2px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      {!isCompleted && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
          style={{ background: "var(--color-brand)", opacity: 0.5 }}
        />
      )}

      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(todo.id, todo.status)}
          className="mt-0.5 shrink-0 flex h-[24px] w-[24px] items-center justify-center rounded-full transition-all duration-200 active:scale-90"
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
                <Check size={12} strokeWidth={3} color="white" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-hidden">
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
              className="mt-0.5 text-[13px] leading-relaxed line-clamp-2"
              style={{ color: "var(--color-muted)" }}
            >
              {todo.description}
            </p>
          )}

          {/* Meta row: due date + assignees */}
          {(todo.due_date || assignees.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {todo.due_date && (
                <div
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{
                    background: "var(--color-brand-soft)",
                    color: "var(--color-brand)",
                  }}
                >
                  <Calendar size={10} strokeWidth={2} />
                  <span className="text-[10px] font-semibold">
                    {new Date(todo.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                  </span>
                </div>
              )}

              {assignees.length > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-interactive-bg)] pl-1 pr-2 py-0.5">
                  <div className="flex -space-x-1">
                    {assignees.slice(0, 3).map((a) => {
                      const name = a.user_profile?.first_name || a.user_profile?.username || "?";
                      return (
                        <div
                          key={a.user_id}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold border border-[var(--color-panel)]"
                          style={{ background: "var(--color-brand)", color: "white" }}
                          title={name}
                        >
                          {a.user_profile?.avatar_url ? (
                            <img src={a.user_profile.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-subtle)]">
                    {assignees.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {todo.photo_url && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2.5 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <div className="relative">
                <Image
                  src={todo.photo_url}
                  alt={todo.title}
                  width={400}
                  height={200}
                  className={cn(
                    "h-36 w-full object-cover transition-all duration-300",
                    isCompleted && "grayscale opacity-50",
                  )}
                />
                <div
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
                >
                  <Camera size={9} color="white" strokeWidth={2} />
                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">Foto</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action row: sign-up + reactions */}
          {currentUserId && !isCompleted && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap overflow-hidden">
              {/* Sign up / unassign button */}
              <button
                onClick={isAssigned ? onUnassign : onAssign}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95",
                  isAssigned
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-interactive-bg)] text-[var(--color-muted)] border border-[var(--color-border)]"
                )}
              >
                <Hand size={11} />
                {isAssigned ? "Dabei" : "Mitmachen"}
              </button>

              {/* Emoji reactions */}
              {Object.entries(reactionGroups).map(([emoji, { count, hasOwn }]) => (
                <button
                  key={emoji}
                  onClick={() => hasOwn ? onUnreact?.(emoji) : onReact?.(emoji)}
                  className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] transition-all active:scale-95"
                  style={{
                    background: hasOwn ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                    border: hasOwn ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                  }}
                >
                  <span className="text-[13px]">{emoji}</span>
                  <span className="text-[9px] font-bold" style={{ color: "var(--color-foreground)" }}>{count}</span>
                </button>
              ))}

              {/* Add reaction button */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full transition-all active:scale-95"
                  style={{
                    background: "var(--color-interactive-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted)",
                  }}
                >
                  <SmilePlus size={11} />
                </button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <>
                      <motion.div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowEmojiPicker(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="fixed left-1/2 bottom-24 -translate-x-1/2 z-40 flex gap-1.5 rounded-2xl p-2.5"
                        style={{
                          background: "var(--color-panel)",
                          border: "1px solid var(--color-border)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        }}
                      >
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              const hasOwn = reactionGroups[emoji]?.hasOwn;
                              if (hasOwn) onUnreact?.(emoji);
                              else onReact?.(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-[20px] transition-all hover:scale-110 active:scale-95"
                            style={{
                              background: reactionGroups[emoji]?.hasOwn ? "var(--color-brand-soft)" : "transparent",
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
