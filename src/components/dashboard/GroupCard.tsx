"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

interface GroupCardProps {
  name: string;
  description: string;
  memberCount: number;
}

export default function GroupCard({ name, description, memberCount }: GroupCardProps) {
  return (
    <Card interactive className="rounded-[36px] bg-white/82 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <Users size={20} />
        </div>
        <motion.div whileHover={{ x: 2 }} className="text-[var(--color-muted)]">
          <ArrowUpRight size={18} />
        </motion.div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-semibold tracking-[-0.045em] text-[var(--color-foreground)]">
          {name}
        </h3>
        <p className="mt-3 text-[15px] leading-7 text-[var(--color-muted)]">{description}</p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <div className="flex -space-x-3">
          <Avatar name="Mila Green" size="sm" />
          <Avatar name="Leo Hart" size="sm" />
          <Avatar name="Ada Bloom" size="sm" />
        </div>
        <p className="text-sm text-[var(--color-muted)]">{memberCount} members</p>
      </div>
    </Card>
  );
}
