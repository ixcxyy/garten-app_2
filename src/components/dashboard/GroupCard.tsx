"use client";

import { ChevronRight, ListTodo, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  name: string;
  description: string | null;
  memberCount: number;
  pendingTodos?: number;
  role?: "owner" | "member";
}

export default function GroupCard({
  name,
  description,
  memberCount,
  pendingTodos = 0,
  role = "member",
}: GroupCardProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)] transition-all active:scale-[0.98] active:bg-[var(--color-canvas)]">
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-brand-soft)] text-[var(--color-brand)] text-base font-bold">
        {initial}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {name}
          </p>
          {role === "owner" && (
            <span className="shrink-0 rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-brand)]">
              Leitung
            </span>
          )}
        </div>

        {description && (
          <p className="mt-0.5 truncate text-[13px] text-[var(--color-muted)]">{description}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[12px] text-[var(--color-subtle)]">
            <Users size={12} strokeWidth={2.5} />
            {memberCount}
          </span>
          {pendingTodos > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              <ListTodo size={11} strokeWidth={2.5} />
              {pendingTodos} offen
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight size={18} className="shrink-0 text-[var(--color-subtle)]" />
    </div>
  );
}
