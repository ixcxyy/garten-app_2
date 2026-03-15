"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";
import { Leaf, Users, CheckSquare, Bell, ArrowRight, Sun, Moon } from "lucide-react";

const isDemoEnv =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isDemoEnv) {
      router.replace("/dashboard");
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-canvas)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        >
          <Leaf size={22} style={{ color: "var(--color-brand)" }} strokeWidth={1.5} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-canvas)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--color-brand)" }}
          >
            <Leaf size={15} strokeWidth={2} style={{ color: "#ffffff" }} />
          </div>
          <span
            className="text-[16px] font-bold"
            style={{ color: "var(--color-foreground)", letterSpacing: "-0.03em" }}
          >
            Garden Groups
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{
            background: "var(--color-interactive-bg)",
            border: "1px solid var(--color-interactive-border)",
            color: "var(--color-muted)",
          }}
          aria-label="Theme wechseln"
        >
          {theme === "dark" ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
        </button>
      </header>

      <main className="flex-1 px-6 pt-10 pb-16 flex flex-col max-w-lg mx-auto w-full">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            style={{
              fontSize: "clamp(2.6rem, 11vw, 3.6rem)",
              fontWeight: 800,
              lineHeight: 0.94,
              letterSpacing: "-0.04em",
              color: "var(--color-foreground)",
            }}
          >
            Gemeinsam{" "}
            <span style={{ color: "var(--color-brand)" }}>gärtnern</span>
            {" "}—{" "}
            <span style={{ color: "var(--color-muted)" }}>organisiert.</span>
          </h1>

          <p
            className="mt-6 text-[15px] leading-relaxed"
            style={{ color: "var(--color-muted)", maxWidth: "30ch" }}
          >
            Erstelle Gartengruppen, verwalte Aufgaben und bleib mit deinem Team in Kontakt.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="mt-10 space-y-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          {[
            { icon: Users, text: "Gruppen erstellen & Mitglieder einladen" },
            { icon: CheckSquare, text: "Aufgaben gemeinsam verwalten" },
            { icon: Bell, text: "Echtzeit-Benachrichtigungen" },
          ].map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "var(--color-brand-soft)",
                  color: "var(--color-brand)",
                }}
              >
                <Icon size={14} strokeWidth={2} />
              </div>
              <span
                className="text-[14px] font-medium"
                style={{ color: "var(--color-foreground)" }}
              >
                {text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-[18px] py-4 text-[16px] font-semibold text-white press-effect"
            style={{
              background: "var(--color-brand)",
              boxShadow: "var(--shadow-brand-lg)",
            }}
          >
            Kostenlos starten
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center rounded-[18px] py-4 text-[16px] font-semibold press-effect"
            style={{
              background: "var(--color-panel)",
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-foreground)",
            }}
          >
            Anmelden
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
