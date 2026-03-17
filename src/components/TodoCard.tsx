"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, Calendar, Hand, SmilePlus, ArrowUp, ArrowDown, Minus, AlertTriangle, CheckSquare, MessageCircle } from "lucide-react";
import { Todo, TaskReaction, UserProfile, Label } from "@/lib/types";
import { cn } from "@/utils/cn";

const EMOJI_OPTIONS = ["👍", "❤️", "🌱", "💪", "🎉", "👏"];

const PRIORITY_CONFIG = {
  low: { icon: ArrowDown, color: '#6B7280', bg: '#6B728012', label: 'Niedrig' },
  normal: { icon: Minus, color: '#3B82F6', bg: '#3B82F612', label: 'Normal' },
  high: { icon: ArrowUp, color: '#F59E0B', bg: '#F59E0B18', label: 'Hoch' },
  urgent: { icon: AlertTriangle, color: '#EF4444', bg: '#EF444418', label: 'Dringend' },
} as const;

interface TodoCardProps {
  todo: Todo;
  onToggleComplete: (id: string, currentStatus: string) => void;
  currentUserId?: string;
  assignees?: { user_id: string; user_profile?: UserProfile }[];
  reactions?: TaskReaction[];
  labels?: Label[];
  checklistProgress?: { done: number; total: number };
  commentCount?: number;
  onAssign?: () => void;
  onUnassign?: () => void;
  onReact?: (emoji: string) => void;
  onUnreact?: (emoji: string) => void;
  onTitleClick?: () => void;
  isAssigned?: boolean;
  isDemoMode?: boolean;
}

const AssigneeModal = ({
  assignees,
  onClose,
}: {
  assignees: { user_id: string; user_profile?: UserProfile }[];
  onClose: () => void;
}) => (
  <>
    <motion.div
      className="fixed inset-0 z-50 bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed left-1/2 top-1/2 z-50 w-[min(320px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5"
      style={{
        background: "var(--color-panel)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
      }}
    >
      <p className="text-[14px] font-bold mb-3" style={{ color: "var(--color-foreground)" }}>
        Teilnehmer ({assignees.length})
      </p>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {assignees.map((a) => {
          const name = a.user_profile?.first_name
            ? `${a.user_profile.first_name}${a.user_profile.last_name ? " " + a.user_profile.last_name : ""}`
            : a.user_profile?.username || "Unbekannt";
          return (
            <div key={a.user_id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "var(--color-interactive-bg)" }}>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: "var(--color-brand)", color: "white" }}
              >
                {a.user_profile?.avatar_url ? (
                  <img src={a.user_profile.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-[13px] font-semibold" style={{ color: "var(--color-foreground)" }}>{name}</span>
            </div>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-3 w-full rounded-xl py-2 text-[13px] font-semibold"
        style={{ background: "var(--color-interactive-bg)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
      >
        Schließen
      </button>
    </motion.div>
  </>
);

export const TodoCard = ({
  todo,
  onToggleComplete,
  currentUserId,
  assignees = [],
  reactions = [],
  labels = [],
  checklistProgress,
  commentCount = 0,
  onAssign,
  onUnassign,
  onReact,
  onUnreact,
  onTitleClick,
  isAssigned = false,
}: TodoCardProps) => {
  const isCompleted = todo.status === "completed";
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAssignees, setShowAssignees] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const priority = todo.priority || 'normal';
  const priCfg = PRIORITY_CONFIG[priority];
  const PriIcon = priCfg.icon;

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
        "relative overflow-hidden rounded-xl bg-[var(--color-panel)]",
        isCompleted ? "opacity-50" : "opacity-100",
      )}
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: isCompleted ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Priority accent bar */}
      {!isCompleted && priority !== 'normal' && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: priCfg.color }}
        />
      )}

      <div className="px-3.5 py-3">
        {/* Top row: checkbox + title */}
        <div className="flex items-start gap-2.5">
          <button
            onClick={() => onToggleComplete(todo.id, todo.status)}
            className="mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-[5px] transition-all duration-200 active:scale-90"
            style={{
              border: isCompleted
                ? "1.5px solid var(--color-brand)"
                : "1.5px solid var(--color-border-strong)",
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
                  <Check size={10} strokeWidth={3} color="white" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="min-w-0 flex-1">
            <p
              onClick={onTitleClick}
              className={cn(
                "text-[14px] font-medium leading-snug",
                isCompleted
                  ? "line-through text-[var(--color-subtle)]"
                  : "text-[var(--color-foreground)]",
                onTitleClick && !isCompleted && "cursor-pointer hover:underline decoration-[var(--color-border-strong)] underline-offset-2",
              )}
            >
              {todo.title}
            </p>

            {todo.description && (
              <p
                className="mt-0.5 text-[12px] leading-relaxed line-clamp-2"
                style={{ color: "var(--color-muted)" }}
              >
                {todo.description}
              </p>
            )}
          </div>
        </div>

        {/* Property chips row — Notion style */}
        <div className="mt-2 ml-[30px] flex flex-wrap items-center gap-1.5">
          {/* Priority chip */}
          <div
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: priCfg.bg, color: priCfg.color, border: `1px solid ${priCfg.color}25` }}
          >
            <PriIcon size={10} />
            {priCfg.label}
          </div>

          {/* Labels */}
          {labels.map(l => (
            <span key={l.id} className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: l.color }}>
              {l.name}
            </span>
          ))}

          {/* Due date */}
          {todo.due_date && (
            <div
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              <Calendar size={9} />
              {new Date(todo.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
            </div>
          )}

          {/* Checklist progress */}
          {checklistProgress && checklistProgress.total > 0 && (
            <div
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                background: checklistProgress.done === checklistProgress.total ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                color: checklistProgress.done === checklistProgress.total ? "var(--color-brand)" : "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              <CheckSquare size={9} />
              {checklistProgress.done}/{checklistProgress.total}
            </div>
          )}

          {/* Comment count */}
          {commentCount > 0 && (
            <div
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--color-interactive-bg)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
            >
              <MessageCircle size={9} />
              {commentCount}
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <button onClick={() => setShowAssignees(true)} className="inline-flex items-center gap-1 rounded-md pl-0.5 pr-1.5 py-0.5 cursor-pointer transition-all active:scale-95"
              style={{ background: "var(--color-interactive-bg)", border: "1px solid var(--color-border)" }}
            >
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
              <span className="text-[9px] font-bold" style={{ color: "var(--color-subtle)" }}>
                {assignees.length}
              </span>
            </button>
          )}
        </div>

        {/* Photo */}
        {todo.photo_url && (
          <div className="mt-2 ml-[30px] overflow-hidden rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
            <Image
              src={todo.photo_url}
              alt={todo.title}
              width={400}
              height={300}
              className={cn(
                "w-full max-h-40 object-contain",
                isCompleted && "grayscale opacity-50",
              )}
              style={{ background: "var(--color-interactive-bg)" }}
            />
          </div>
        )}

        {/* Action row: sign-up + reactions */}
        {currentUserId && !isCompleted && (
          <div className="mt-2 ml-[30px] flex items-center gap-1.5 flex-wrap">
            <button
              onClick={isAssigned ? onUnassign : onAssign}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all active:scale-95",
                isAssigned
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--color-muted)]"
              )}
              style={isAssigned ? {} : { background: "var(--color-interactive-bg)", border: "1px solid var(--color-border)" }}
            >
              <Hand size={10} />
              {isAssigned ? "Dabei" : "Mitmachen"}
            </button>

            {Object.entries(reactionGroups).map(([emoji, { count, hasOwn }]) => (
              <button
                key={emoji}
                onClick={() => hasOwn ? onUnreact?.(emoji) : onReact?.(emoji)}
                className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] transition-all active:scale-95"
                style={{
                  background: hasOwn ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                  border: hasOwn ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                }}
              >
                <span className="text-[12px]">{emoji}</span>
                <span className="text-[9px] font-bold" style={{ color: "var(--color-foreground)" }}>{count}</span>
              </button>
            ))}

            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md transition-all active:scale-95"
                style={{
                  background: "var(--color-interactive-bg)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                }}
              >
                <SmilePlus size={10} />
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

      <AnimatePresence>
        {showAssignees && assignees.length > 0 && (
          <AssigneeModal assignees={assignees} onClose={() => setShowAssignees(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
