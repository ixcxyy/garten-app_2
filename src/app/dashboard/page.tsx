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
    description: "Dachgarten mit Giessplan und Wochenend-Einsaetzen.",
    inviteCode: "DEMO01",
    memberCount: 12,
    pendingTodos: 4,
    completedTodos: 8,
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
    role: "member",
  },
];

function GroupCard({
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
  const initial = name.charAt(0).toUpperCase();
  const total = pendingTodos + completedTodos;
  const progress = total > 0 ? Math.round((completedTodos / total) * 100) : 0;

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
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
        />

        <div className="px-5 py-5">
          <div className="flex items-start justify-between mb-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#ffffff",
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
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Crown size={8} />
                  Leitung
                </span>
              )}
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full opacity-40 group-hover:opacity-70 transition-opacity"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <ArrowRight size={11} style={{ color: "#fff" }} />
              </div>
            </div>
          </div>

          <h3
            className="text-[16px] font-semibold leading-tight mb-1.5"
            style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
          >
            {name}
          </h3>

          {description && (
            <p
              className="text-[13px] leading-relaxed line-clamp-2 mb-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {description}
            </p>
          )}

          <div
            className="flex items-center justify-between pt-3.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <Users size={11} strokeWidth={1.8} />
                {memberCount}
              </span>

              {pendingTodos > 0 ? (
                <span
                  className="rounded-full px-2.5 py-[3px] text-[11px] font-medium"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {pendingTodos} offen
                </span>
              ) : total > 0 ? (
                <span
                  className="rounded-full px-2.5 py-[3px] text-[11px] font-medium"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  Erledigt
                </span>
              ) : null}
            </div>

            {total > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="h-[2px] w-16 overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "rgba(255,255,255,0.3)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: index * 0.06 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{ color: "rgba(255,255,255,0.35)" }}
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#000" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
          <Leaf size={18} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.5} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-36" style={{ background: "#000000" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
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
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Leaf size={13} style={{ color: "rgba(255,255,255,0.6)" }} strokeWidth={1.8} />
          </div>
          <span
            className="text-[15px] font-semibold"
            style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
          >
            Garden Groups
          </span>
        </motion.div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {isSearchOpen ? <X size={15} strokeWidth={2} /> : <Search size={15} strokeWidth={1.8} />}
          </motion.button>

          <div className="relative">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <Avatar name={profileDisplayName} className="h-7 w-7 text-[10px]" />
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
                    className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl"
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "var(--shadow-modal)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[13px] font-semibold" style={{ color: "#ffffff" }}>
                        {profileDisplayName}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium"
                      style={{ color: "#dc2626" }}
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

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden sticky top-[49px] z-20"
            style={{
              background: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="px-5 py-2.5">
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Search size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Gruppe suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder:text-white/20"
                  style={{ color: "#ffffff" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X size={13} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="px-5 overflow-x-hidden">
        <motion.div
          className="pt-10 pb-9"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-px w-5" style={{ background: "rgba(255,255,255,0.2)" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.35)" }}
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
              color: "#ffffff",
            }}
          >
            Hallo,{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", display: "inline-block" }}>
              {greetingName}
            </span>
          </h1>

          <p
            className="mt-4 text-[14px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.3)", maxWidth: "26ch" }}
          >
            {groups.length > 0
              ? `${groups.length} ${groups.length === 1 ? "Gruppe" : "Gruppen"} aktiv · ${totalPendingTodos} offen`
              : "Erstelle deine erste Gartengruppe"}
          </p>
        </motion.div>

        {groups.length > 0 && (
          <motion.div
            className="mb-8 grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {[
              { label: "Gruppen", value: groups.length },
              { label: "Offen", value: totalPendingTodos },
              { label: "Erledigt", value: totalCompletedTodos },
            ].map(({ label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl px-3 py-4 text-center"
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)",
                }}
              >
                <p
                  className="text-[28px] leading-none font-bold tabular-nums"
                  style={{ color: "#ffffff", letterSpacing: "-0.04em" }}
                >
                  {value}
                </p>
                <p
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em] shrink-0"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {searchQuery ? `Ergebnisse (${filteredGroups.length})` : "Deine Gruppen"}
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
        </motion.div>

        {filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-col items-center justify-center rounded-2xl py-16 text-center"
            style={{
              background: "#0a0a0a",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Sprout size={24} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.5} />
            </div>
            <h3
              className="text-[17px] font-bold"
              style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
            >
              {searchQuery ? "Keine Treffer" : "Noch keine Gruppen"}
            </h3>
            <p
              className="mt-2 text-[13px] max-w-[200px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.3)" }}
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
                  role={group.role}
                  index={i}
                  onClick={() => router.push(`/group/${group.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 24, delay: 0.4 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-28 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "#ffffff",
          color: "#000000",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.3), 0 0 60px rgba(255,255,255,0.06)",
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
        <div className="flex min-h-screen items-center justify-center" style={{ background: "#000" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
            <Leaf size={18} style={{ color: "rgba(255,255,255,0.3)" }} strokeWidth={1.5} />
          </motion.div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
