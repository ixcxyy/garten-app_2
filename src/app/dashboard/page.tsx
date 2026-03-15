"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck,
  Leaf,
  ListTodo,
  Loader2,
  Plus,
  Search,
  Sprout,
  Users,
  X,
  LogOut,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import GroupCard from "@/components/dashboard/GroupCard";
import { Avatar } from "@/components/ui";
import { supabase, signOut } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import { cn, getProfileDisplayName, getProfileGreetingName } from "@/lib/utils";
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)]">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--color-canvas)] pb-28">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--color-brand)] text-white">
              <Leaf size={15} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-[var(--color-foreground)]">
              Garden Groups
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)]"
            >
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="transition-transform active:scale-95"
              >
                <Avatar name={profileDisplayName} className="h-8 w-8 text-xs" />
              </button>

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
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-modal)]"
                    >
                      <div className="border-b border-[var(--color-border)] px-4 py-3">
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {profileDisplayName}
                        </p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Abmelden
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[var(--color-border)]"
            >
              <div className="px-4 py-2.5">
                <input
                  autoFocus
                  type="text"
                  placeholder="Gruppe suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="px-4 pt-5">
        {/* Greeting + summary */}
        <div className="mb-5">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            Hallo {greetingName} 👋
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            {groups.length > 0
              ? `${groups.length} Gruppen · ${totalPendingTodos} offene Aufgaben`
              : "Erstelle deine erste Gartengruppe"}
          </p>
        </div>

        {/* Stats row */}
        {groups.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-2.5">
            {[
              { icon: Sprout, label: "Gruppen", value: groups.length, color: "text-[var(--color-brand)]", bg: "bg-[var(--color-brand-soft)]" },
              { icon: ListTodo, label: "Offen", value: totalPendingTodos, color: "text-amber-600", bg: "bg-amber-50" },
              { icon: CheckCheck, label: "Erledigt", value: totalCompletedTodos, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3 shadow-[var(--shadow-soft)]">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${bg} ${color}`}>
                  <Icon size={15} strokeWidth={2.3} />
                </div>
                <p className="text-[22px] font-bold tracking-tight text-[var(--color-foreground)]">{value}</p>
                <p className="text-[11px] text-[var(--color-subtle)]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Groups section */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--color-subtle)]">
            {searchQuery ? `Ergebnisse (${filteredGroups.length})` : "Deine Gruppen"}
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[var(--color-brand)]"
            >
              Leeren
            </button>
          )}
        </div>

        {filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-white/60 py-14 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              <Sprout size={26} />
            </div>
            <h3 className="text-base font-bold text-[var(--color-foreground)]">
              {searchQuery ? "Keine Treffer" : "Noch keine Gruppen"}
            </h3>
            <p className="mt-1.5 max-w-[220px] text-sm text-[var(--color-muted)]">
              {searchQuery
                ? "Versuche einen anderen Begriff"
                : "Tippe auf + um deine erste Gruppe zu erstellen"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  onClick={() => router.push(`/group/${group.id}`)}
                  className="cursor-pointer"
                >
                  <GroupCard
                    name={group.name}
                    description={group.description}
                    memberCount={group.memberCount}
                    pendingTodos={group.pendingTodos}
                    role={group.role}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating action button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_8px_24px_rgba(47,106,83,0.4)] transition-all active:shadow-none"
      >
        <Plus size={24} strokeWidth={2.5} />
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
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)]">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
