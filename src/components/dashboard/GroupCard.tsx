"use client";

import { ArrowUpRight, ListTodo, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
  const roleLabel = role === "owner" ? "Leitung" : "Mitglied";

  return (
    <Card 
      interactive 
      className="group relative overflow-hidden rounded-[32px] bg-white p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card border border-[var(--color-border)] hover:border-[var(--color-brand-soft)]"
    >
      <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-[var(--color-brand-soft)] to-transparent opacity-30 blur-3xl pointer-events-none" />
      
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-strong)] text-white shadow-soft transition-transform group-hover:scale-105 active:scale-95">
          <Users size={24} />
        </div>
        <div className="rounded-full bg-[var(--color-canvas)] p-2 text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <h3 className="text-[22px] font-extrabold tracking-tight text-[var(--color-foreground)] group-hover:text-[var(--color-brand)] transition-colors">
          {name}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)] line-clamp-2">
          {description?.trim() || "Noch keine Beschreibung. Nutze die Gruppe, um Aufgaben und Einladungen zentral zu koordinieren."}
        </p>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] bg-[var(--color-canvas)] px-4 py-3">
          <div className="flex items-center gap-2 text-[var(--color-muted)]">
            <Users size={14} strokeWidth={2.4} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Mitglieder</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-foreground)]">{memberCount}</p>
        </div>
        <div className="rounded-[22px] bg-[var(--color-canvas)] px-4 py-3">
          <div className="flex items-center gap-2 text-[var(--color-muted)]">
            <ListTodo size={14} strokeWidth={2.4} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Offen</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-foreground)]">{pendingTodos}</p>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-5">
        <div className="flex items-center gap-2 rounded-full bg-[var(--color-brand-soft)] px-3 py-1.5 text-[var(--color-brand)]">
          <Shield size={14} strokeWidth={2.5} />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]">{roleLabel}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-subtle)]">
          Öffnen
          <ArrowUpRight size={16} />
        </div>
      </div>
    </Card>
  );
}
