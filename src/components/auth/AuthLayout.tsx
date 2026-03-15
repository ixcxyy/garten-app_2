"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="section-shell flex min-h-screen items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl"
      >
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-subtle)]">
            Garden Groups
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--color-foreground)]">
            {title}
          </h1>
          <p className="mt-3 text-[17px] leading-8 text-[var(--color-muted)]">{subtitle}</p>
        </div>

        <Card className="glass-panel rounded-[36px] p-8 sm:p-10">{children}</Card>
      </motion.div>
    </div>
  );
}
