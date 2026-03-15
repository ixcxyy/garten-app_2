"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LayoutGrid, UserCircle2 } from "lucide-react";

const navItems = [
  { icon: Home, label: "Start", href: "/" },
  { icon: LayoutGrid, label: "Gruppen", href: "/dashboard" },
  { icon: UserCircle2, label: "Konto", href: "/dashboard" },
];

export default function MobileNav() {
  const pathname = usePathname();

  // Determine active item based on pathname
  const getActiveHref = () => {
    if (pathname === "/") return "/";
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/group") || pathname.startsWith("/invite")) return "/dashboard";
    return "/";
  };
  const activeHref = getActiveHref();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5 sm:hidden">
      {/* Blur backdrop extension */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--color-canvas)] to-transparent pointer-events-none" />

      <nav
        style={{
          background: "rgba(254, 252, 247, 0.92)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(255,255,255,0.7)",
        }}
        className="relative mx-auto flex max-w-xs items-center justify-around rounded-[28px] px-2 py-2"
      >
        {navItems.map((item) => {
          const isActive = activeHref === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex h-14 flex-1 items-center justify-center rounded-[22px]"
            >
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="nav-bg"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute inset-0 z-0 rounded-[22px]"
                    style={{ background: "var(--color-brand-soft)" }}
                  />
                )}
              </AnimatePresence>

              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <motion.span
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? "var(--color-brand)" : "var(--color-subtle)" }}
                  />
                </motion.span>
                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  className="text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: isActive ? "var(--color-brand)" : "var(--color-subtle)" }}
                >
                  {item.label}
                </motion.span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
