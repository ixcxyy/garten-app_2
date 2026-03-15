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
  ArrowRight,
  Crown,
  Sun,
  Moon,
  Settings,
  Calendar,
  Clock,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { supabase, signOut } from "@/lib/supabase";
import { UserProfile, Todo } from "@/lib/types";
import { getProfileDisplayName, getProfileGreetingName } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { CreateGroupModal } from "@/components/dashboard/CreateGroupModal";
import { useTheme } from "@/lib/theme";
import Link from "next/link";

type DashboardGroup = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  pendingTodos: number;
  completedTodos: number;
  pendingDueTodos: number;
  completedDueTodos: number;
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
    description: "Dachgarten mit Giessplan und Wochenend-Einsaetzen.",
    inviteCode: "DEMO01",
    memberCount: 12,
    pendingTodos: 4,
    completedTodos: 8,
    pendingDueTodos: 2,
    completedDueTodos: 4,
    role: "owner",
  },
  {
    id: "demo-2",
    name: "Green Neighbors",
    description: "Nachbarschaftsbeet fuer Kraeuter und Bluehflaechen.",
    inviteCode: "DEMO02",
    memberCount: 8,
    pendingTodos: 2,
    completedTodos: 5,
    pendingDueTodos: 1,
    completedDueTodos: 3,
    role: "member",
  },
  {
    id: "demo-3",
    name: "Community Orchard",
    description: "Obstbaeume, Schnitt-Erinnerungen und Ernteplanung.",
    inviteCode: "DEMO03",
    memberCount: 25,
    pendingTodos: 7,
    completedTodos: 12,
    pendingDueTodos: 3,
    completedDueTodos: 6,
    role: "member",
  },
];

function GroupCard({
  name,
  description,
  memberCount,
  pendingTodos = 0,
  completedTodos = 0,
  pendingDueTodos = 0,
  completedDueTodos = 0,
  role = "member",
  onClick,
  index = 0,
}: {
  name: string;
  description: string | null;
  memberCount: number;
  pendingTodos?: number;
  completedTodos?: number;
  pendingDueTodos?: number;
  completedDueTodos?: number;
  role?: "owner" | "member";
  onClick?: () => void;
  index?: number;
}) {
  const initial = name.charAt(0).toUpperCase();
  const totalDue = pendingDueTodos + completedDueTodos;
  const progress = totalDue > 0 ? Math.round((completedDueTodos / totalDue) * 100) : 0;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left group"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-200"
        style={{
          background: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-border-highlight), transparent)",
          }}
        />

        <div className="px-5 py-5">
          <div className="flex items-start justify-between mb-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold"
              style={{
                background: "var(--color-interactive-bg)",
                border: "1px solid var(--color-interactive-border)",
                color: "var(--color-foreground)",
                letterSpacing: "-0.02em",
              }}
            >
              {initial}
            </div>

            <div className="flex items-center gap-2">
              {role === "owner" && (
                <span
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: "var(--color-brand-soft)",
                    color: "var(--color-brand)",
                    border: "1px solid var(--color-interactive-border)",
                  }}
                >
                  <Crown size={8} />
                  Leitung
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3
                className="text-[18px] font-bold leading-tight mb-1 truncate"
                style={{ color: "var(--color-foreground)", letterSpacing: "-0.03em" }}
              >
                {name}
              </h3>
              {description && (
                <p
                  className="text-[13px] leading-snug line-clamp-1 mb-0"
                  style={{ color: "var(--color-muted)" }}
                >
                  {description}
                </p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              <div
                className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-interactive-bg)", color: "var(--color-subtle)" }}
              >
                <Users size={10} strokeWidth={2.5} />
                {memberCount}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pendingTodos > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
                    <span className="text-[12px] font-bold text-[var(--color-subtle)]">
                      {pendingTodos} <span className="font-semibold opacity-60">Aufgaben</span>
                    </span>
                  </div>
                ) : (
                  <span className="text-[12px] font-bold" style={{ color: "var(--color-brand)" }}>
                    Alles erledigt ✨
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-border-strong)]"
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--color-brand)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-[var(--color-muted)]">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDemoMode =
    searchParams.get("mode") === "demo" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [upcomingTodos, setUpcomingTodos] = useState<(Todo & { group_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { requestPermission, sendLocalNotification, subscribeToPush } = useNotifications(undefined, userProfile?.id, { autoSubscribe: false });

  const fetchData = useCallback(async () => {
    if (groups.length === 0) setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user && !isDemoMode) {
        router.push("/login");
        return;
      }

      if (user && !isDemoMode) {
        let { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // Create profile if it doesn't exist yet (fallback for missed trigger)
        if (!profile) {
          const meta = user.user_metadata ?? {};
          await supabase.from("user_profiles").upsert({
            id: user.id,
            username: meta.username || user.email?.split("@")[0] || "user",
            first_name: meta.first_name || null,
            last_name: meta.last_name || null,
            avatar_url: meta.avatar_url || null,
          });
          const { data: retry } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          profile = retry;
        }

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
              pendingDueTodos: 0,
              completedDueTodos: 0,
              role: membership.role === "owner" ? "owner" : "member",
            } satisfies DashboardGroup;
          })
          .filter(Boolean) as DashboardGroup[];

        if (!normalizedGroups.length) {
          setGroups([]);
          return;
        }

        const groupIds = normalizedGroups.map((g) => g.id);
        const [{ data: memberRows }, { data: todoRows }] =
          await Promise.all([
            supabase.from("group_members").select("group_id").in("group_id", groupIds),
            supabase
              .from("todos")
              .select("group_id, status, due_date")
              .in("group_id", groupIds),
          ]);

        const memberCounts = (memberRows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          return acc;
        }, {});
        const pendingCounts = (todoRows ?? []).reduce<Record<string, number>>((acc, row) => {
          if (row.status === "pending") {
            acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          }
          return acc;
        }, {});
        const doneCounts = (todoRows ?? []).reduce<Record<string, number>>((acc, row) => {
          if (row.status === "completed") {
            acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          }
          return acc;
        }, {});
        const pendingDueCounts = (todoRows ?? []).reduce<Record<string, number>>((acc, row) => {
          if (row.status === "pending" && row.due_date !== null) {
            acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          }
          return acc;
        }, {});
        const doneDueCounts = (todoRows ?? []).reduce<Record<string, number>>((acc, row) => {
          if (row.status === "completed" && row.due_date !== null) {
            acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          }
          return acc;
        }, {});

        setGroups(
          normalizedGroups.map((g) => ({
            ...g,
            memberCount: memberCounts[g.id] ?? 1,
            pendingTodos: pendingCounts[g.id] ?? 0,
            completedTodos: doneCounts[g.id] ?? 0,
            pendingDueTodos: pendingDueCounts[g.id] ?? 0,
            completedDueTodos: doneDueCounts[g.id] ?? 0,
          })),
        );

        // Fetch upcoming todos from all groups
        const { data: allPending } = await supabase
          .from("todos")
          .select("*, groups(name)")
          .in("group_id", groupIds)
          .eq("status", "pending")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(4);

        if (allPending) {
          setUpcomingTodos(allPending.map(t => ({
            ...t,
            group_name: (t.groups as any)?.name || "Unbekannt"
          })));
        }
      } else if (isDemoMode) {
        setGroups(MOCK_GROUPS);
        setUserProfile({
          id: "demo",
          username: "Gaertner.Pro",
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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-canvas)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        >
          <Leaf size={18} style={{ color: "var(--color-brand)" }} strokeWidth={1.5} />
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen pb-36"
      style={{ background: "var(--color-canvas)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{
          background: "var(--color-header-bg)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2.5"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: "var(--color-brand-soft)",
              border: "1px solid var(--color-interactive-border)",
            }}
          >
            <Leaf size={13} style={{ color: "var(--color-brand)" }} strokeWidth={1.8} />
          </div>
          <span
            className="text-[15px] font-semibold"
            style={{ color: "var(--color-foreground)", letterSpacing: "-0.02em" }}
          >
            Garden Groups
          </span>
        </motion.div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "var(--color-muted)" }}
          >
            {isSearchOpen ? (
              <X size={15} strokeWidth={2} />
            ) : (
              <Search size={15} strokeWidth={1.8} />
            )}
          </motion.button>

          <div className="relative">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <Avatar name={profileDisplayName} src={userProfile?.avatar_url} className="h-7 w-7 text-[10px]" />
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
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl"
                    style={{
                      background: "var(--color-panel)",
                      border: "1px solid var(--color-border-strong)",
                      boxShadow: "var(--shadow-modal)",
                    }}
                  >
                    {/* User info */}
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {profileDisplayName}
                      </p>
                    </div>

                    {/* Theme toggle */}
                    <button
                      onClick={() => {
                        toggleTheme();
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium"
                      style={{
                        color: "var(--color-foreground)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {theme === "dark" ? (
                        <Sun size={13} style={{ color: "var(--color-muted)" }} />
                      ) : (
                        <Moon size={13} style={{ color: "var(--color-muted)" }} />
                      )}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>

                    {/* Account link */}
                    <Link
                      href="/account"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium"
                      style={{
                        color: "var(--color-foreground)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <Settings size={13} style={{ color: "var(--color-muted)" }} />
                      Einstellungen
                    </Link>

                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <LogOut size={13} />
                      Abmelden
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden sticky top-[49px] z-20"
            style={{
              background: "var(--color-overlay-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div className="px-5 py-2.5">
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
                style={{
                  background: "var(--color-interactive-bg)",
                  border: "1px solid var(--color-interactive-border)",
                }}
              >
                <Search size={13} style={{ color: "var(--color-subtle)" }} />
                <input
                  type="text"
                  placeholder="Gruppe suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] focus:outline-none"
                  style={{
                    color: "var(--color-foreground)",
                  }}
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

      <div className="px-5 mt-4">
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={async () => {
              const ok = await requestPermission();
              if (ok) await subscribeToPush();
            }}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-4"
            style={{ 
              background: 'var(--color-brand-soft)', 
              border: '1px solid var(--color-interactive-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-[var(--color-brand)] shadow-sm">
                <Leaf size={18} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-[var(--color-foreground)]">Push-Mitteilungen</p>
                <p className="text-[11px] font-medium text-[var(--color-subtle)]">Jetzt aktivieren für Live-Updates</p>
              </div>
            </div>
            <div className="h-8 px-4 bg-[var(--color-brand)] text-white text-[12px] font-bold rounded-lg flex items-center justify-center">
              Aktivieren
            </div>
          </motion.button>
        )}
      </div>

      <main className="px-5 overflow-x-hidden">
        {/* Greeting */}
        <motion.div
          className="pt-10 pb-9"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="h-px w-5"
              style={{ background: "var(--color-border-strong)" }}
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--color-subtle)" }}
            >
              Dein Garten
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 11vw, 3.4rem)",
              fontWeight: 800,
              lineHeight: 0.94,
              letterSpacing: "-0.04em",
              color: "var(--color-foreground)",
            }}
          >
            Willkommen zurück{greetingName ? "," : "!"}{" "}
            {greetingName && (
              <span style={{ color: "var(--color-brand)", display: "inline-block" }}>
                {greetingName}
              </span>
            )}
          </h1>

          <p
            className="mt-4 text-[14px] leading-relaxed"
            style={{ color: "var(--color-subtle)", maxWidth: "26ch" }}
          >
            {groups.length > 0
              ? `${groups.length} ${groups.length === 1 ? "Gruppe" : "Gruppen"} aktiv · ${totalPendingTodos} offen`
              : "Erstelle deine erste Gartengruppe"}
          </p>
        </motion.div>

        {/* Stats cards */}
        {groups.length > 0 && (
          <motion.div
            className="mb-8 grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="col-span-2 relative overflow-hidden rounded-[2rem] px-6 py-6"
              style={{
                background: "linear-gradient(135deg, var(--color-brand), #2dd4bf)",
                boxShadow: "var(--shadow-brand-lg)",
              }}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold text-white/70 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-[32px] font-extrabold text-white leading-none tracking-tight">
                    {totalPendingTodos} <span className="text-[14px] font-medium opacity-80">offen</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Sprout size={24} color="white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
            </motion.div>

            {[
              { label: "Gruppen", value: groups.length, icon: <Users size={14} /> },
              { label: "Erledigt", value: totalCompletedTodos, icon: <Check size={14} /> },
            ].map(({ label, value, icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.15 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-[1.8rem] px-5 py-4"
                style={{
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-center gap-2 mb-2 text-[var(--color-muted)]">
                  {icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-[24px] font-extrabold" style={{ color: "var(--color-foreground)", letterSpacing: "-0.04em" }}>
                  {value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Upcoming Tasks Section */}
        {upcomingTodos.length > 0 && !searchQuery && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[14px] font-bold uppercase tracking-[0.15em] text-[var(--color-subtle)]">Anstehend</h2>
              <Clock size={14} className="text-[var(--color-muted)]" />
            </div>
            <div className="space-y-2.5">
              {upcomingTodos.map((todo, idx) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3.5 transition-all hover:border-[var(--color-brand-soft)]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                  onClick={() => router.push(`/group/${todo.group_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[var(--color-subtle)] uppercase tracking-wider mb-0.5">
                        {todo.group_name}
                      </p>
                      <h3 className="truncate text-[15px] font-semibold text-[var(--color-foreground)]">
                        {todo.title}
                      </h3>
                    </div>
                    {todo.due_date && (
                      <div className="ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold bg-[var(--color-brand-soft)] text-[var(--color-brand)] border border-[var(--color-interactive-border)]">
                        {new Date(todo.due_date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Section label */}
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em] shrink-0"
            style={{ color: "var(--color-subtle)" }}
          >
            {searchQuery ? `Ergebnisse (${filteredGroups.length})` : "Deine Gruppen"}
          </span>
          <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        </motion.div>

        {/* Group list / empty state */}
        {filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-col items-center justify-center rounded-2xl py-16 text-center"
            style={{
              background: "var(--color-panel)",
              border: "1px dashed var(--color-border-strong)",
            }}
          >
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: "var(--color-interactive-bg)",
                border: "1px solid var(--color-interactive-border)",
              }}
            >
              <Sprout
                size={24}
                style={{ color: "var(--color-muted)" }}
                strokeWidth={1.5}
              />
            </div>
            <h3
              className="text-[17px] font-bold"
              style={{ color: "var(--color-foreground)", letterSpacing: "-0.02em" }}
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
                <GroupCard
                  key={group.id}
                  name={group.name}
                  description={group.description}
                  memberCount={group.memberCount}
                  pendingTodos={group.pendingTodos}
                  completedTodos={group.completedTodos}
                  pendingDueTodos={group.pendingDueTodos}
                  completedDueTodos={group.completedDueTodos}
                  role={group.role}
                  index={i}
                  onClick={() => router.push(`/group/${group.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 24, delay: 0.4 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-28 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "var(--color-fab-bg)",
          color: "var(--color-fab-fg)",
          boxShadow: "var(--shadow-brand-lg)",
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
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "var(--color-canvas)" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          >
            <Leaf size={18} style={{ color: "var(--color-brand)" }} strokeWidth={1.5} />
          </motion.div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
