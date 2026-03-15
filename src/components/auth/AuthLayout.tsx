"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flower2 } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="section-shell relative flex min-h-screen items-center justify-center py-12 sm:py-20" style={{ background: "var(--color-canvas)" }}>
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--color-brand-glow), transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--color-brand-glow), transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[480px]"
      >
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "var(--color-brand-soft)",
              border: "1px solid var(--color-interactive-border)",
              color: "var(--color-brand)",
            }}
          >
            <Flower2 size={24} />
          </Link>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>
            Garden Groups
          </p>
          <h1 className="display-lg mt-3 font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            {title}
          </h1>
          <p className="mt-4 text-balance text-base leading-relaxed" style={{ color: "var(--color-muted)" }}>
            {subtitle}
          </p>
        </div>

        <div
          className="overflow-hidden rounded-[28px] p-8 sm:p-10"
          style={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-border-strong)",
            boxShadow: "var(--shadow-modal)",
          }}
        >
          {children}
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--color-subtle)" }}>
          <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">Startseite</Link>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--color-border-strong)" }} />
          <Link href="#" className="transition-colors hover:text-[var(--color-foreground)]">Hilfe</Link>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--color-border-strong)" }} />
          <Link href="#" className="transition-colors hover:text-[var(--color-foreground)]">Datenschutz</Link>
        </div>
      </motion.div>
    </div>
  );
}
