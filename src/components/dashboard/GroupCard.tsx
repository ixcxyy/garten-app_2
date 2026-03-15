"use client";

import { motion } from "framer-motion";
import { Users, Leaf, Crown } from "lucide-react";

interface GroupCardProps {
  name: string;
  description: string | null;
  memberCount: number;
  pendingTodos?: number;
  role?: "owner" | "member";
}

// Warm palette for group avatars
const GROUP_COLORS = [
  { bg: "#eaf3ee", text: "#2d6147", ring: "rgba(45,97,71,0.15)" },
  { bg: "#fdf3e3", text: "#c4861a", ring: "rgba(196,134,26,0.15)" },
  { bg: "#f0eaf5", text: "#6b4d8a", ring: "rgba(107,77,138,0.15)" },
  { bg: "#fde8e8", text: "#b03a3a", ring: "rgba(176,58,58,0.15)" },
  { bg: "#e8f0fd", text: "#3a65b0", ring: "rgba(58,101,176,0.15)" },
];

function getColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

export default function GroupCard({
  name,
  description,
  memberCount,
  pendingTodos = 0,
  role = "member",
}: GroupCardProps) {
  const initial = name.charAt(0).toUpperCase();
  const colors = getColorForName(name);

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="relative flex items-center gap-4 overflow-hidden rounded-[22px] bg-[var(--color-panel)] px-4 py-4"
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Subtle accent line */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
        style={{ background: colors.text, opacity: 0.5 }}
      />

      {/* Avatar */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
        style={{
          background: colors.bg,
          color: colors.text,
          boxShadow: `0 0 0 3px ${colors.ring}`,
          fontFamily: "var(--font-instrument-serif)",
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className="truncate text-[15px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            {name}
          </p>
          {role === "owner" && (
            <span
              className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: colors.bg, color: colors.text }}
            >
              <Crown size={8} />
              Leitung
            </span>
          )}
        </div>

        {description && (
          <p
            className="mt-0.5 truncate text-[12.5px] leading-snug"
            style={{ color: "var(--color-muted)" }}
          >
            {description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <span
            className="flex items-center gap-1 text-[12px]"
            style={{ color: "var(--color-subtle)" }}
          >
            <Users size={11} strokeWidth={2.2} />
            {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"}
          </span>

          {pendingTodos > 0 ? (
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}
            >
              <Leaf size={10} strokeWidth={2.5} />
              {pendingTodos} offen
            </span>
          ) : (
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}
            >
              Alles erledigt ✓
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <svg
        width="7"
        height="12"
        viewBox="0 0 7 12"
        fill="none"
        className="shrink-0"
        style={{ color: "var(--color-subtle)" }}
      >
        <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}
