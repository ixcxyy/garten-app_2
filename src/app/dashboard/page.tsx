"use client";

import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";
import GroupCard from "@/components/dashboard/GroupCard";
import { Avatar, Button } from "@/components/ui";

const MOCK_GROUPS = [
  {
    id: 1,
    name: "Urban Oasis Garden",
    description: "A rooftop group that plans watering, composting, and weekend planting sessions together.",
    memberCount: 12,
  },
  {
    id: 2,
    name: "Green Neighbors",
    description: "A neighborhood collective focused on pollinator beds, herbs, and shared seasonal checklists.",
    memberCount: 8,
  },
  {
    id: 3,
    name: "Community Orchard",
    description: "Fruit tree care, pruning reminders, and harvest planning for a shared public orchard.",
    memberCount: 25,
  },
];

export default function DashboardPage() {
  return (
    <div className="section-shell py-6 sm:py-10">
      <div className="glass-panel overflow-hidden rounded-[40px]">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sm:px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-subtle)]">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Garden Groups</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--color-muted)] shadow-[var(--shadow-soft)]">
              <Search size={18} />
            </button>
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--color-muted)] shadow-[var(--shadow-soft)]">
              <Bell size={18} />
            </button>
            <Avatar name="Mila Green" />
          </div>
        </header>

        <main className="space-y-10 px-5 py-6 sm:px-8 sm:py-8">
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h2 className="display-lg max-w-3xl font-semibold text-balance">
                Shared garden planning that feels calm, clear, and collaborative.
              </h2>
              <p className="mt-4 max-w-2xl text-[17px] leading-8 text-[var(--color-muted)]">
                Organize members, coordinate seasonal work, and keep every task visible without the noise.
              </p>
            </motion.div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" size="lg">
                Invite members
              </Button>
              <Button size="lg">Create group</Button>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {MOCK_GROUPS.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <GroupCard
                  name={group.name}
                  description={group.description}
                  memberCount={group.memberCount}
                />
              </motion.div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
