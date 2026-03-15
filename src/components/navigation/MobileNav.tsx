"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, LayoutGrid, UserCircle2 } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
  { icon: UserCircle2, label: "Account", href: "/login" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:hidden">
      <div className="glass-panel mx-auto flex max-w-sm items-center justify-between rounded-[28px] px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex min-w-[84px] flex-1 items-center justify-center"
            >
              {isActive ? (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 rounded-[20px] bg-white/80"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10 flex h-14 flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <Icon size={18} className={isActive ? "text-[var(--color-brand)]" : ""} />
                <span className={isActive ? "text-[var(--color-foreground)]" : ""}>{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
