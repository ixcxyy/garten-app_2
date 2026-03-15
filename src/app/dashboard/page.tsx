"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Plus,
  Search,
  Sprout,
  Users,
  X,
  LogOut,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { supabase, signOut } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import { getProfileDisplayName, getProfileGreetingName } from "@/lib/utils";
import { CreateGroupModal } from "@/components/dashboard/CreateGroupModal";

type DashboardGroup = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  pendingTodos: number;
  completedTodos: number;
  role: "owner" | "member";
};

type GroupRelationRow = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
};

type GroupMembershipRow = {
  group_id: string;
  role: string;
  groups: GroupRelationRow | GroupRelationRow[] | null;
};

const MOCK_GROUPS: DashboardGroup[] = [
  {
    id: "demo-1",
    name: "Urban Oasis Garden",
    description: "Dachgarten mit Gießplan und Wochenend-Einsätzen.",
    inviteCode: "DEMO01",
    memberCount: 12,
    pendingTodos: 4,
    completedTodos: 8,
    role: "owner",
  },
  {
    id: "demo-2",
    name: "Green Neighbors",
    description: "Nachbarschaftsbeet für Kräuter und Blühflächen.",
    inviteCode: "DEMO02",
    memberCount: 8,
    pendingTodos: 2,
    completedTodos: 5,
    role: "member",
  },
  {
    id: "demo-3",
    name: "Community Orchard",
    description: "Obstbäume, Schnitt-Erinnerungen und Ernteplanung.",
    inviteCode: "DEMO03",
    memberCount: 25,
    pendingTodos: 7,
    completedTodos: 12,
    role: "member",
  },
];

const GROUP_PALETTES = [
  { soft: "#eaf3ee", accent: "#2d6147" },
  { soft: "#fdf3e3", accent: "#c4861a" },
  { soft: "#eeebf5", accent: "#6b4d8a" },
  { soft: "#fde8e8", accent: "#b03a3a" },
  { soft: "#e5eefb", accent: "#3a65b0" },
];

function getPaletteForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GROUP_PALETTES[Math.abs(hash) % GROUP_PALETTES.length];
}

function PremiumGroupCard({
  name,
  description,
  memberCount,
  pendingTodos = 0,
  completedTodos = 0,
  role = "member",
  onClick,
  index = 0,
}: {
  name: string;
  description: string | null;
  memberCount: number;
  pendingTodos?: number;
  completedTodos?: number;
  role?: "owner" | "member";
  onClick?: () => void;
  index?: number;
}) {
  const palette = getPaletteForName(name);
  const initial = name.charAt(0).toUpperCase();
  const total = pendingTodos + completedTodos;
  const progress = total > 0 ? Math.round((completedTodos / total) * 100) : 0;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.983 }}
      className="w-full text-left"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="relative overflow-hidden rounded-[24px]"
        style={{
          background: "var(--color-panel)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.055)",
        }}
      >
        {/* Top accent line */}
        <div className="h-[2.5px] w-full" style={{ background: palette.accent, opacity: 0.65 }} />

        <div className="px-5 pt-4 pb-5">
          {/* Top row: avatar + badge + chevron */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[18px] font-bold"
              style={{
                background: palette.soft,
                color: palette.accent,
                fontFamily: "var(--font-instrument-serif)",
              }}
            >
              {initial}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {role === "owner" && (
                <span
                  className="flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: palette.soft, color: palette.accent }}
                >
                  <Crown size={8} />
                  Leitung
                </span>
              )}
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "var(--color-canvas-alt)" }}
              >
                <ChevronRight size={11} style={{ color: "var(--color-subtle)" }} />
              </div>
            </div>
          </div>

          {/* Name */}
          <h3
            className="text-[17px] leading-tight tracking-tight mb-1"
            style={{
              color: "var(--color-foreground)",
              fontFamily: "var(--font-instrument-serif)",
              fontWeight: 400,
            }}
          >
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p
              className="text-[13px] leading-relaxed line-clamp-2 mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              {description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-3">
              <span
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "var(--color-subtle)" }}
              >
                <Users size={11} strokeWidth={2} />
                {memberCount}
              </span>

              {pendingTodos > 0 ? (
                <span
                  className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                  style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}
                >
                  {pendingTodos} offen
                </span>
              ) : total > 0 ? (
                <span
                  className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                  style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}
                >
                  ✓ Erledigt
                </span>
              ) : null}
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="h-1 w-14 overflow-hidden rounded-full"
                  style={{ background: "var(--color-canvas-alt)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: palette.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, delay: index * 0.07 + 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: "var(--color-subtle)" }}
                >
                  {progress}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemoMode =
    searchParams.get("mode") === "demo" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user && !isDemoMode) {
        router.push("/login");
        return;
      }

      if (user && !isDemoMode) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        setUserProfile(profile);

        const { data: userGroups, error: userGroupsError } = await supabase
          .from("group_members")
          .select(`group_id, role, groups (id, name, description, invite_code)`)
          .eq("user_id", user.id);

        if (userGroupsError) throw userGroupsError;

        const normalizedGroups = ((userGroups ?? []) as GroupMembershipRow[])
          .map((membership) => {
            const group = Array.isArray(membership.groups)
              ? membership.groups[0]
              : membership.groups;
            if (!group?.id) return null;
            return {
              id: group.id,
              name: group.name,
              description: group.description,
              inviteCode: group.invite_code,
              memberCount: 1,
              pendingTodos: 0,
              completedTodos: 0,
              role: membership.role === "owner" ? "owner" : "member",
            } satisfies DashboardGroup;
          })
          .filter(Boolean) as DashboardGroup[];

        if (!normalizedGroups.length) {
          setGroups([]);
          return;
        }

        const groupIds = normalizedGroups.map((g) => g.id);
        const [{ data: memberRows }, { data: pendingRows }, { data: doneRows }] = await Promise.all([
          supabase.from("group_members").select("group_id").in("group_id", groupIds),
          supabase.from("todos").select("group_id").in("group_id", groupIds).eq("status", "pending"),
          supabase.from("todos").select("group_id").in("group_id", groupIds).eq("status", "completed"),
        ]);

        const memberCounts = (memberRows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          return acc;
        }, {});
        const pendingCounts = (pendingRows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          return acc;
        }, {});
        const doneCounts = (doneRows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          return acc;
        }, {});

        setGroups(
          normalizedGroups.map((g) => ({
            ...g,
            memberCount: memberCounts[g.id] ?? 1,
            pendingTodos: pendingCounts[g.id] ?? 0,
            completedTodos: doneCounts[g.id] ?? 0,
          })),
        );
      } else if (isDemoMode) {
        setGroups(MOCK_GROUPS);
        setUserProfile({
          id: "demo",
          username: "Gärtner.Pro",
          first_name: "Demo",
          last_name: "User",
          avatar_url: null,
          created_at: new Date().toISOString(),
        } as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, router]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const profileDisplayName = getProfileDisplayName(userProfile);
  const greetingName = getProfileGreetingName(userProfile);
  const totalPendingTodos = groups.reduce((s, g) => s + g.pendingTodos, 0);
  const totalCompletedTodos = groups.reduce((s, g) => s + g.completedTodos, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-canvas)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
          <Leaf size={22} style={{ color: "var(--color-brand)" }} strokeWidth={1.5} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-36" style={{ background: "var(--color-canvas)" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5"
        style={{
          background: "rgba(245,240,232,0.9)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-white"
            style={{ background: "var(--color-brand)" }}
          >
            <Leaf size={13} strokeWidth={2} />
          </div>
          <span
            className="text-[15px] tracking-tight"
            style={{
              color: "var(--color-foreground)",
              fontFamily: "var(--font-instrument-serif)",
              letterSpacing: "-0.01em",
            }}
          >
            Garden Groups
          </span>
        </motion.div>

        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "var(--color-muted)" }}
          >
            {isSearchOpen ? <X size={16} strokeWidth={2} /> : <Search size={16} strokeWidth={1.8} />}
          </motion.button>

          <div className="relative">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <Avatar name={profileDisplayName} className="h-7 w-7 text-[11px]" />
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl"
                    style={{
                      background: "var(--color-panel)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-modal)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                        {profileDisplayName}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <LogOut size={14} />
                      Abmelden
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Search bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden sticky top-[52px] z-20"
            style={{
              background: "rgba(245,240,232,0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div className="px-5 py-2.5">
              <div
                className="flex items-center gap-2 rounded-[14px] px-4 py-2.5"
                style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
              >
                <Search size={13} style={{ color: "var(--color-subtle)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Gruppe suchen…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] focus:outline-none"
                  style={{ color: "var(--color-foreground)" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X size={13} style={{ color: "var(--color-subtle)" }} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="px-5 overflow-x-hidden">

        {/* ── Hero Greeting ───────────────────────────────────── */}
        <motion.div
          className="pt-8 pb-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ background: "var(--color-brand)", opacity: 0.45 }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--color-brand)" }}
            >
              Dein Garten
            </span>
          </div>

          {/* Main heading */}
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: "clamp(2.5rem, 11vw, 3.4rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "var(--color-foreground)",
            }}
          >
            Hallo,{" "}
            <span style={{ fontStyle: "italic", color: "var(--color-brand)" }}>
              {greetingName}
            </span>
          </h1>

          <p
            className="mt-3 text-[14px] leading-relaxed"
            style={{ color: "var(--color-muted)", maxWidth: "28ch" }}
          >
            {groups.length > 0
              ? `${groups.length} ${groups.length === 1 ? "Gruppe" : "Gruppen"} aktiv · ${totalPendingTodos} offen`
              : "Erstelle deine erste Gartengruppe"}
          </p>
        </motion.div>

        {/* ── Stats Strip ─────────────────────────────────────── */}
        {groups.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="flex rounded-[20px] overflow-hidden"
              style={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
              }}
            >
              {[
                { label: "Gruppen", value: groups.length, color: "var(--color-brand)" },
                { label: "Offen", value: totalPendingTodos, color: "var(--color-warning)" },
                { label: "Erledigt", value: totalCompletedTodos, color: "var(--color-success)" },
              ].map(({ label, value, color }, i) => (
                <div
                  key={label}
                  className="flex-1 px-3 py-4 text-center"
                  style={{ borderRight: i < 2 ? "1px solid var(--color-border)" : undefined }}
                >
                  <p
                    className="text-[28px] leading-none tabular-nums"
                    style={{
                      color,
                      fontFamily: "var(--font-instrument-serif)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {value}
                  </p>
                  <p
                    className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--color-subtle)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Section label ───────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em] shrink-0"
            style={{ color: "var(--color-subtle)" }}
          >
            {searchQuery ? `Ergebnisse (${filteredGroups.length})` : "Deine Gruppen"}
          </span>
          <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        </motion.div>

        {/* ── Groups ──────────────────────────────────────────── */}
        {filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-col items-center justify-center rounded-[28px] py-16 text-center"
            style={{
              background: "var(--color-panel)",
              border: "1.5px dashed var(--color-border)",
            }}
          >
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px]"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              <Sprout size={28} strokeWidth={1.5} />
            </div>
            <h3
              className="text-[18px]"
              style={{ color: "var(--color-foreground)", fontFamily: "var(--font-instrument-serif)" }}
            >
              {searchQuery ? "Keine Treffer" : "Noch keine Gruppen"}
            </h3>
            <p
              className="mt-2 text-[13px] max-w-[200px] leading-relaxed"
              style={{ color: "var(--color-muted)" }}
            >
              {searchQuery
                ? "Versuche einen anderen Begriff"
                : "Tippe auf + um deine erste Gruppe zu erstellen"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredGroups.map((group, i) => (
                <PremiumGroupCard
                  key={group.id}
                  name={group.name}
                  description={group.description}
                  memberCount={group.memberCount}
                  pendingTodos={group.pendingTodos}
                  completedTodos={group.completedTodos}
                  role={group.role}
                  index={i}
                  onClick={() => router.push(`/group/${group.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 26, delay: 0.4 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-28 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white"
        style={{
          background: "var(--color-brand)",
          boxShadow: "0 4px 24px rgba(45,97,71,0.38), 0 1px 6px rgba(45,97,71,0.18)",
        }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </motion.button>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateGroupModal
            isDemoMode={isDemoMode}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={(groupId: string) => {
              void fetchData();
              router.push(`/group/${groupId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-canvas)" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}>
            <Leaf size={22} style={{ color: "var(--color-brand)" }} strokeWidth={1.5} />
          </motion.div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
