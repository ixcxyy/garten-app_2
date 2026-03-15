"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, LayoutGrid, UserCircle2 } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
  { icon: UserCircle2, label: "Account", href: "/dashboard" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:hidden">
      <div className="glass-panel mx-auto flex max-w-sm items-center justify-between rounded-[32px] px-2 py-2 shadow-modal">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex h-14 min-w-[80px] flex-1 items-center justify-center rounded-[24px] transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 z-0 rounded-[24px] bg-[var(--color-brand-soft)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-[var(--color-brand)]" : "text-[var(--color-muted)]"} 
                />
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isActive ? "text-[var(--color-brand)]" : "text-[var(--color-subtle)]"}`}>
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
