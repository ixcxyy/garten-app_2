"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Flower2, Leaf } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="section-shell relative flex min-h-screen items-center justify-center py-12 sm:py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(47,106,83,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(47,106,83,0.08),transparent_70%)] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[480px]"
      >
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] shadow-soft transition-transform hover:scale-105 active:scale-95">
            <Flower2 size={24} />
          </Link>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            Garden Groups
          </p>
          <h1 className="display-lg mt-3 font-bold tracking-tight text-[var(--color-foreground)]">
            {title}
          </h1>
          <p className="mt-4 text-balance text-base leading-relaxed text-[var(--color-muted)]">
            {subtitle}
          </p>
        </div>

        <div className="glass-panel overflow-hidden rounded-[32px] border border-white p-8 shadow-modal sm:p-10">
          {children}
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-subtle)]">
          <Link href="/" className="hover:text-[var(--color-foreground)] transition-colors">Startseite</Link>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <Link href="#" className="hover:text-[var(--color-foreground)] transition-colors">Hilfe</Link>
          <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <Link href="#" className="hover:text-[var(--color-foreground)] transition-colors">Datenschutz</Link>
        </div>
      </motion.div>
    </div>
  );
}
