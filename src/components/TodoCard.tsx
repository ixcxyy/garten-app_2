"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, Calendar, Hand, SmilePlus } from "lucide-react";
import { Todo, TaskReaction, UserProfile } from "@/lib/types";
import { cn } from "@/utils/cn";
import { supabase } from "@/lib/supabase";

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
  isDemoMode,
}: TodoCardProps) => {
  const isCompleted = todo.status === "completed";
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const reactionGroups = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-[var(--color-panel)] transition-opacity duration-300",
        isCompleted ? "opacity-60" : "opacity-100",
      )}
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: isCompleted
          ? "none"
          : "0 4px 20px -4px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04)",
      }}
    >
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

          {/* Meta row: due date + assignees */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {todo.due_date && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: "var(--color-brand-soft)",
                  color: "var(--color-brand)",
                }}
              >
                <Calendar size={11} strokeWidth={2} />
                <span className="text-[11px] font-semibold">
                  {new Date(todo.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                </span>
              </div>
            )}

            {/* Assignees avatars */}
            {assignees.length > 0 && (
              <div className="inline-flex min-h-[28px] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-interactive-bg)] pl-1.5 pr-2.5 py-1">
                <div className="flex -space-x-1.5 h-5">
                  {assignees.slice(0, 4).map((a) => {
                    const name = a.user_profile?.first_name || a.user_profile?.username || "?";
                    return (
                      <div
                        key={a.user_id}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold border border-[var(--color-panel)] shadow-sm"
                        style={{ background: "var(--color-brand)", color: "white" }}
                        title={name}
                      >
                        {a.user_profile?.avatar_url ? (
                          <img src={a.user_profile.avatar_url} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] font-bold text-[var(--color-subtle)] uppercase tracking-tight">
                  {assignees.length} dabei
                </span>
              </div>
            )}
          </div>

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

          {/* Action row: sign-up + reactions */}
          {currentUserId && !isCompleted && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {/* Sign up / unassign button */}
              <button
                onClick={isAssigned ? onUnassign : onAssign}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-all active:scale-95 shadow-sm",
                  isAssigned 
                    ? "bg-[var(--color-brand)] text-white" 
                    : "bg-[var(--color-interactive-bg)] text-[var(--color-muted)] border border-[var(--color-border)] hover:bg-[var(--color-border-strong)]"
                )}
              >
                <Hand size={12} className={cn(isAssigned && "animate-bounce")} />
                {isAssigned ? "Ich bin dabei" : "Mitmachen"}
              </button>

              {/* Emoji reactions */}
              {Object.entries(reactionGroups).map(([emoji, { count, hasOwn }]) => (
                <button
                  key={emoji}
                  onClick={() => hasOwn ? onUnreact?.(emoji) : onReact?.(emoji)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] transition-all active:scale-95"
                  style={{
                    background: hasOwn ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                    border: hasOwn ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                  }}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--color-foreground)" }}>{count}</span>
                </button>
              ))}

              {/* Add reaction button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full transition-all active:scale-95"
                  style={{
                    background: "var(--color-interactive-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted)",
                  }}
                >
                  <SmilePlus size={13} />
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
                        initial={{ opacity: 0, scale: 0.8, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 4 }}
                        className="absolute bottom-full mb-2 left-0 z-40 flex gap-1 rounded-2xl p-2"
                        style={{
                          background: "var(--color-panel)",
                          border: "1px solid var(--color-border)",
                          boxShadow: "var(--shadow-modal)",
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
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[18px] transition-all hover:scale-110 active:scale-95"
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
