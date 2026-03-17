"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Calendar, Hand, SmilePlus, ArrowUp, ArrowDown, Minus, AlertTriangle,
  CheckSquare, MessageCircle, MoreHorizontal, Trash2, Tag, Clock, X,
} from "lucide-react";
import { Todo, TaskReaction, UserProfile, Label } from "@/lib/types";
import { cn } from "@/utils/cn";

const EMOJI_OPTIONS = ["👍", "❤️", "🌱", "💪", "🎉", "👏"];

const PRIORITY_CONFIG = {
  low: { icon: ArrowDown, color: '#6B7280', bg: '#6B728012', label: 'Niedrig' },
  normal: { icon: Minus, color: '#3B82F6', bg: '#3B82F612', label: 'Normal' },
  high: { icon: ArrowUp, color: '#F59E0B', bg: '#F59E0B18', label: 'Hoch' },
  urgent: { icon: AlertTriangle, color: '#EF4444', bg: '#EF444418', label: 'Dringend' },
} as const;

// Haptic feedback helper
function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const ms = style === 'light' ? 10 : style === 'medium' ? 20 : 40;
    navigator.vibrate(ms);
  }
}

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
  onDelete?: () => void;
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
      <p className="text-[15px] font-bold mb-3" style={{ color: "var(--color-foreground)" }}>
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: "var(--color-brand)", color: "white" }}
              >
                {a.user_profile?.avatar_url ? (
                  <img src={a.user_profile.avatar_url} className="h-full w-full rounded-full object-cover" alt="" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-[14px] font-semibold" style={{ color: "var(--color-foreground)" }}>{name}</span>
            </div>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold"
        style={{ background: "var(--color-interactive-bg)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
      >
        Schließen
      </button>
    </motion.div>
  </>
);

// Image lightbox component
const ImageLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
  <>
    <motion.div
      className="fixed inset-0 z-[70] bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ backdropFilter: "blur(8px)" }}
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed inset-4 z-[70] flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
      >
        <X size={20} />
      </button>
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={900}
        className="max-h-full max-w-full object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
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
  onDelete,
  isAssigned = false,
}: TodoCardProps) => {
  const isCompleted = todo.status === "completed";
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAssignees, setShowAssignees] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
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

  const formatDateRange = () => {
    const parts: string[] = [];
    if (todo.start_date) {
      parts.push(new Date(todo.start_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" }));
    }
    if (todo.due_date) {
      parts.push(new Date(todo.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" }));
    }
    return parts.join(" → ");
  };

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

      <div className="px-4 py-3.5">
        {/* Top row: checkbox + title + context menu */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => { haptic('medium'); onToggleComplete(todo.id, todo.status); }}
            className="mt-[2px] shrink-0 flex h-[22px] w-[22px] items-center justify-center rounded-[6px] transition-all duration-200 active:scale-90"
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

          <div className="min-w-0 flex-1">
            <p
              onClick={() => { haptic(); onTitleClick?.(); }}
              className={cn(
                "text-[16px] font-semibold leading-snug",
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
                className="mt-0.5 text-[13px] leading-relaxed line-clamp-2"
                style={{ color: "var(--color-muted)" }}
              >
                {todo.description}
              </p>
            )}
          </div>

          {/* Context menu button */}
          <div className="relative">
            <button
              onClick={() => { haptic(); setShowContextMenu(!showContextMenu); }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all active:scale-90"
              style={{ color: "var(--color-muted)" }}
            >
              <MoreHorizontal size={18} />
            </button>
            <AnimatePresence>
              {showContextMenu && (
                <>
                  <motion.div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowContextMenu(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    className="absolute right-0 top-9 z-40 w-48 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--color-panel)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    }}
                  >
                    <button
                      onClick={() => { haptic(); setShowContextMenu(false); onTitleClick?.(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-left transition-colors active:scale-[0.98]"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      <CheckSquare size={15} style={{ color: "var(--color-muted)" }} />
                      Details bearbeiten
                    </button>
                    <button
                      onClick={() => { haptic(); setShowContextMenu(false); onTitleClick?.(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-left transition-colors active:scale-[0.98]"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      <Tag size={15} style={{ color: "var(--color-muted)" }} />
                      Labels & Priorität
                    </button>
                    <button
                      onClick={() => { haptic(); setShowContextMenu(false); onTitleClick?.(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-left transition-colors active:scale-[0.98]"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      <Clock size={15} style={{ color: "var(--color-muted)" }} />
                      Zeitraum setzen
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => { haptic('heavy'); setShowContextMenu(false); onDelete(); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-left transition-colors active:scale-[0.98]"
                        style={{ color: "#EF4444", borderTop: "1px solid var(--color-border)" }}
                      >
                        <Trash2 size={15} />
                        Löschen
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Property chips row */}
        <div className="mt-2.5 ml-[34px] flex flex-wrap items-center gap-1.5">
          {/* Priority chip */}
          <div
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: priCfg.bg, color: priCfg.color, border: `1px solid ${priCfg.color}25` }}
          >
            <PriIcon size={12} />
            {priCfg.label}
          </div>

          {/* Labels */}
          {labels.map(l => (
            <span key={l.id} className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: l.color }}>
              {l.name}
            </span>
          ))}

          {/* Date range */}
          {(todo.start_date || todo.due_date) && (
            <div
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              <Calendar size={11} />
              {formatDateRange()}
            </div>
          )}

          {/* Checklist progress */}
          {checklistProgress && checklistProgress.total > 0 && (
            <div
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: checklistProgress.done === checklistProgress.total ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                color: checklistProgress.done === checklistProgress.total ? "var(--color-brand)" : "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              <CheckSquare size={11} />
              {checklistProgress.done}/{checklistProgress.total}
            </div>
          )}

          {/* Comment count */}
          {commentCount > 0 && (
            <div
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--color-interactive-bg)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}
            >
              <MessageCircle size={11} />
              {commentCount}
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <button onClick={() => { haptic(); setShowAssignees(true); }} className="inline-flex items-center gap-1.5 rounded-md pl-1 pr-2 py-0.5 cursor-pointer transition-all active:scale-95"
              style={{ background: "var(--color-interactive-bg)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex -space-x-1.5">
                {assignees.slice(0, 3).map((a) => {
                  const name = a.user_profile?.first_name || a.user_profile?.username || "?";
                  return (
                    <div
                      key={a.user_id}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold border-[1.5px] border-[var(--color-panel)]"
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
              <span className="text-[10px] font-bold" style={{ color: "var(--color-subtle)" }}>
                {assignees.length}
              </span>
            </button>
          )}
        </div>

        {/* Photo */}
        {todo.photo_url && (
          <div
            className="mt-2.5 ml-[34px] overflow-hidden rounded-lg cursor-pointer transition-transform active:scale-[0.98]"
            style={{ border: "1px solid var(--color-border)" }}
            onClick={() => { haptic(); setShowLightbox(true); }}
          >
            <Image
              src={todo.photo_url}
              alt={todo.title}
              width={400}
              height={300}
              className={cn(
                "w-full max-h-44 object-contain",
                isCompleted && "grayscale opacity-50",
              )}
              style={{ background: "var(--color-interactive-bg)" }}
            />
          </div>
        )}

        {/* Action row: sign-up + reactions */}
        {currentUserId && !isCompleted && (
          <div className="mt-2.5 ml-[34px] flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { haptic('medium'); isAssigned ? onUnassign?.() : onAssign?.(); }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all active:scale-95",
                isAssigned
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--color-muted)]"
              )}
              style={isAssigned ? {} : { background: "var(--color-interactive-bg)", border: "1px solid var(--color-border)" }}
            >
              <Hand size={13} />
              {isAssigned ? "Dabei" : "Mitmachen"}
            </button>

            {Object.entries(reactionGroups).map(([emoji, { count, hasOwn }]) => (
              <button
                key={emoji}
                onClick={() => { haptic(); hasOwn ? onUnreact?.(emoji) : onReact?.(emoji); }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition-all active:scale-95"
                style={{
                  background: hasOwn ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                  border: hasOwn ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                }}
              >
                <span className="text-[14px]">{emoji}</span>
                <span className="text-[10px] font-bold" style={{ color: "var(--color-foreground)" }}>{count}</span>
              </button>
            ))}

            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => { haptic(); setShowEmojiPicker(!showEmojiPicker); }}
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg transition-all active:scale-95"
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
                            haptic();
                            const hasOwn = reactionGroups[emoji]?.hasOwn;
                            if (hasOwn) onUnreact?.(emoji);
                            else onReact?.(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-[22px] transition-all hover:scale-110 active:scale-95"
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
        {showLightbox && todo.photo_url && (
          <ImageLightbox src={todo.photo_url} alt={todo.title} onClose={() => setShowLightbox(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
