"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Copy,
  Leaf,
  ListTodo,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
  UserPlus,
  X,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import GroupCard from "@/components/dashboard/GroupCard";
import { Avatar, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import Link from "next/link";
import {
  cn,
  getProfileDisplayName,
  getProfileGreetingName,
  getProfileSecondaryName,
} from "@/lib/utils";
import { CreateGroupModal } from "@/components/dashboard/CreateGroupModal";
import { ProfileDropdown } from "@/components/dashboard/ProfileDropdown";
import { NotificationsPeek } from "@/components/dashboard/NotificationsPeek";

type DashboardGroup = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  pendingTodos: number;
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
    description: "Eine Dachgarten-Gruppe mit Gießplan, Kompost-Updates und Wochenend-Einsätzen.",
    inviteCode: "DEMO01",
    memberCount: 12,
    pendingTodos: 4,
    role: "owner",
  },
  {
    id: "demo-2",
    name: "Green Neighbors",
    description: "Nachbarschaftsbeet für Kräuter, Blühflächen und gemeinsame Saison-Checklisten.",
    inviteCode: "DEMO02",
    memberCount: 8,
    pendingTodos: 2,
    role: "member",
  },
  {
    id: "demo-3",
    name: "Community Orchard",
    description: "Obstbäume, Schnitt-Erinnerungen und Ernteplanung für eine geteilte Streuobstwiese.",
    inviteCode: "DEMO03",
    memberCount: 25,
    pendingTodos: 7,
    role: "member",
  },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemoMode = searchParams.get("mode") === "demo" || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
  
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // UI states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false);
      
      if (!error && data) {
        setUnreadCount(data.length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && !isDemoMode) {
        router.push("/login");
        return;
      }

      if (user) {
        void fetchNotifications(user.id);

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        setUserProfile(profile);

        const { data: userGroups, error: userGroupsError } = await supabase
          .from("group_members")
          .select(`
            group_id,
            role,
            groups (
              id,
              name,
              description,
              invite_code
            )
          `)
          .eq("user_id", user.id);

        if (userGroupsError) {
          throw userGroupsError;
        }

        const normalizedGroups = ((userGroups ?? []) as GroupMembershipRow[])
          .map((membership) => {
            const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups;

            if (!group?.id) {
              return null;
            }

            return {
              id: group.id,
              name: group.name,
              description: group.description,
              inviteCode: group.invite_code,
              memberCount: 1,
              pendingTodos: 0,
              role: membership.role === "owner" ? "owner" : "member",
            } satisfies DashboardGroup;
          })
          .filter(Boolean) as DashboardGroup[];

        if (!normalizedGroups.length) {
          setGroups([]);
          return;
        }

        const groupIds = normalizedGroups.map((group) => group.id);
        const [{ data: memberRows, error: memberRowsError }, { data: todoRows, error: todoRowsError }] = await Promise.all([
          supabase.from("group_members").select("group_id").in("group_id", groupIds),
          supabase.from("todos").select("group_id").in("group_id", groupIds).eq("status", "pending"),
        ]);

        if (memberRowsError) {
          throw memberRowsError;
        }

        if (todoRowsError) {
          throw todoRowsError;
        }

        const memberCounts = (memberRows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          return acc;
        }, {});

        const pendingCounts = (todoRows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
          return acc;
        }, {});

        setGroups(
          normalizedGroups.map((group) => ({
            ...group,
            memberCount: memberCounts[group.id] ?? group.memberCount,
            pendingTodos: pendingCounts[group.id] ?? 0,
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
          created_at: new Date().toISOString()
        } as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications, isDemoMode, router]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (group.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const profileDisplayName = getProfileDisplayName(userProfile);
  const profileSecondaryName = getProfileSecondaryName(userProfile);
  const greetingName = getProfileGreetingName(userProfile);
  const totalPendingTodos = groups.reduce((sum, group) => sum + group.pendingTodos, 0);
  const totalMembers = groups.reduce((sum, group) => sum + group.memberCount, 0);
  const ownerGroups = groups.filter((group) => group.role === "owner").length;

  const handleInviteAction = useCallback(async () => {
    if (!groups.length) {
      setInviteFeedback("Erstelle zuerst eine Gruppe. Danach kannst du Einladungslinks direkt teilen.");
      setIsCreateModalOpen(true);
      return;
    }

    const group = groups[0];
    const inviteLink = `${window.location.origin}/invite/${group.inviteCode}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteFeedback(`Einladungslink für "${group.name}" wurde kopiert.`);
    } catch (error) {
      console.error("Error copying invite link:", error);
      setInviteFeedback("Der Einladungslink konnte nicht kopiert werden.");
    }

    window.setTimeout(() => setInviteFeedback(null), 2800);
  }, [groups]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="section-shell py-6 sm:py-10 relative">
      <div className="glass-panel overflow-hidden rounded-[40px] shadow-card">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-6 sm:px-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--color-brand)] text-white shadow-soft transition-transform hover:scale-105 active:scale-95">
              <Leaf size={22} />
            </Link>
            <div className={cn(isSearchActive ? "hidden sm:block" : "block")}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">Dashboard</p>
              <h1 className="text-xl font-extrabold tracking-tight">Meine Gruppen</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 rounded-full transition-all duration-300",
              isSearchActive ? "w-48 sm:w-64 bg-[var(--color-canvas)] px-3 py-1.5" : "w-10 overflow-hidden"
            )}>
              <button 
                onClick={() => setIsSearchActive(!isSearchActive)}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]",
                  !isSearchActive && "bg-[var(--color-canvas)] text-[var(--color-muted)]"
                )}
              >
                <Search size={18} strokeWidth={isSearchActive ? 3 : 2.5} />
              </button>
              {isSearchActive && (
                <>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold placeholder:text-[var(--color-subtle)] focus:outline-none"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-subtle)] transition-colors hover:bg-white hover:text-[var(--color-foreground)]"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  ) : null}
                </>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] relative",
                  isNotificationsOpen ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]" : "bg-[var(--color-canvas)] text-[var(--color-muted)]"
                )}
              >
                <Bell size={18} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <NotificationsPeek 
                isOpen={isNotificationsOpen} 
                onClose={() => {
                  setIsNotificationsOpen(false);
                  if (userProfile?.id) fetchNotifications(userProfile.id);
                }} 
              />
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="transition-transform hover:scale-105 active:scale-95"
              >
                <Avatar 
                  name={profileDisplayName} 
                  src={userProfile?.avatar_url}
                  className="h-10 w-10 border-2 border-white shadow-soft" 
                />
              </button>
              <ProfileDropdown 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)}
                displayName={profileDisplayName}
                secondaryName={profileSecondaryName}
                avatarName={profileDisplayName}
                avatarUrl={userProfile?.avatar_url}
              />
            </div>
          </div>
        </header>

        <main className="space-y-12 px-6 py-8 sm:px-10 sm:py-12">
          {isDemoMode && (
            <div className="rounded-[28px] bg-[var(--color-brand-soft)] p-7 shadow-soft">
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-brand)] shadow-soft">
                  <Leaf size={24} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[16px] font-bold text-[var(--color-brand-strong)]">Demo-Modus</p>
                  <p className="text-[14px] leading-relaxed text-[var(--color-muted)]">
                    Du siehst gerade Beispiel-Daten. Verbinde dein Supabase-Projekt, um echte Gruppen zu erstellen.
                  </p>
                </div>
              </div>
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[36px] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top_left,_rgba(47,106,83,0.2),_transparent_45%),linear-gradient(135deg,#ffffff_0%,#f5fbf7_100%)] p-8 shadow-soft sm:p-10"
            >
              <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-[var(--color-brand-soft)] blur-3xl" />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-brand)]">Heute im Beet</p>
                <h2 className="mt-3 text-[32px] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-[46px]">
                  Hallo {greetingName}, <br />
                  was säen wir heute?
                </h2>
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)] sm:text-[16px]">
                  {groups.length > 0
                    ? `Du hast aktuell ${totalPendingTodos} offene Aufgaben in ${groups.length} Gruppen. Teile Einladungslinks, priorisiere Aufgaben und halte deine Garten-Community an einem Ort zusammen.`
                    : "Starte mit deiner ersten Gartengruppe und sammle Aufgaben, Mitglieder und Einladungen an einem Ort."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    className="gap-2"
                    onClick={handleInviteAction}
                  >
                    {groups.length > 0 ? <Copy size={18} strokeWidth={2.5} /> : <UserPlus size={18} strokeWidth={2.5} />}
                    {groups.length > 0 ? "Link kopieren" : "Einladen"}
                  </Button>
                  <Button
                    size="md"
                    className="gap-2"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus size={18} strokeWidth={3} />
                    Gruppe erstellen
                  </Button>
                </div>

                <AnimatePresence>
                  {inviteFeedback ? (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="mt-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-brand-strong)] shadow-soft"
                    >
                      {inviteFeedback}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  label: "Gruppen",
                  value: groups.length,
                  icon: Sprout,
                  accent: "text-[var(--color-brand)]",
                  hint: groups.length > 0 ? "Aktive Bereiche" : "Noch kein Beet angelegt",
                },
                {
                  label: "Offene Aufgaben",
                  value: totalPendingTodos,
                  icon: ListTodo,
                  accent: "text-amber-600",
                  hint: totalPendingTodos > 0 ? "Brauchen Aufmerksamkeit" : "Alles gerade erledigt",
                },
                {
                  label: "Deine Leitung",
                  value: ownerGroups,
                  icon: ShieldCheck,
                  accent: "text-sky-600",
                  hint: ownerGroups > 0 ? `${totalMembers} Mitglieder insgesamt` : "Noch keine Gruppe geleitet",
                },
              ].map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    className="rounded-[28px] border border-[var(--color-border)] bg-white/80 p-5 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-subtle)]">{stat.label}</p>
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-canvas)]", stat.accent)}>
                        <Icon size={18} strokeWidth={2.3} />
                      </div>
                    </div>
                    <p className="mt-5 text-4xl font-extrabold tracking-tight text-[var(--color-foreground)]">{stat.value}</p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{stat.hint}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-subtle)]">Übersicht</p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--color-foreground)]">
                  {searchQuery ? "Gefilterte Gruppen" : "Deine Gartenbereiche"}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {searchQuery
                    ? `${filteredGroups.length} Treffer für "${searchQuery}".`
                    : groups.length > 0
                      ? `${groups.length} Gruppen mit ${totalPendingTodos} offenen Aufgaben.`
                      : "Hier erscheinen deine Gruppen, sobald du die erste anlegst oder per Einladung beitrittst."}
                </p>
              </div>
              {searchQuery ? (
                <Button variant="ghost" size="sm" className="gap-2 self-start sm:self-auto" onClick={() => setSearchQuery("")}>
                  <X size={16} strokeWidth={2.5} />
                  Filter löschen
                </Button>
              ) : null}
            </div>

            {filteredGroups.length === 0 ? (
              searchQuery ? (
                <div className="flex flex-col items-center justify-center rounded-[36px] border border-dashed border-[var(--color-border)] bg-white/50 py-16 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-subtle)]">
                    <Search size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold">Keine Ergebnisse</h3>
                  <p className="mt-2 max-w-sm text-[var(--color-muted)]">
                    Versuche einen anderen Suchbegriff oder lösche den Filter, um alle Gruppen wieder zu sehen.
                  </p>
                  <Button size="md" className="mt-8" onClick={() => setSearchQuery("")}>
                    Suche leeren
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                  <div className="rounded-[36px] border border-dashed border-[var(--color-border)] bg-white/60 px-8 py-12 text-center shadow-soft">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-subtle)]">
                      <Plus size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight">Noch keine Gruppen</h3>
                    <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-muted)]">
                      Erstelle deine erste Gruppe, lade Mitgärtner ein und sammle Aufgaben an einem Ort. So wächst aus dem Dashboard direkt eine funktionierende Gartenzentrale.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <Button size="md" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} strokeWidth={3} />
                        Jetzt Gruppe erstellen
                      </Button>
                      <Button variant="secondary" size="md" className="gap-2" onClick={handleInviteAction}>
                        <UserPlus size={18} strokeWidth={2.5} />
                        Einladen vorbereiten
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-[var(--color-border)] bg-white/80 p-6 shadow-soft">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-subtle)]">Schnellstart</p>
                    <h4 className="mt-2 text-xl font-extrabold tracking-tight">In 3 Schritten loslegen</h4>
                    <div className="mt-6 space-y-4">
                      {[
                        "Gruppe anlegen und kurz beschreiben, wofür sie gedacht ist.",
                        "Einladungslink kopieren und an Mitgärtner schicken.",
                        "Erste Aufgaben anlegen, damit die Gruppe direkt nutzbar ist.",
                      ].map((item, index) => (
                        <div key={item} className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand)]">
                            {index + 1}
                          </div>
                          <p className="pt-1 text-sm leading-relaxed text-[var(--color-muted)]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
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
              </section>
            )}
          </section>
        </main>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateGroupModal 
            isDemoMode={isDemoMode}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={(groupId: string) => {
              fetchData();
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
    <Suspense fallback={<DashboardContentFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContentFallback() {
  return (
    <div className="section-shell py-6 sm:py-10">
      <div className="glass-panel overflow-hidden rounded-[40px] shadow-card">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-6 sm:px-10">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 animate-pulse rounded-[14px] bg-[var(--color-canvas)]" />
            <div className="space-y-2">
              <div className="h-2 w-16 animate-pulse rounded bg-[var(--color-canvas)]" />
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-canvas)]" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-canvas)]" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-canvas)]" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-canvas)]" />
          </div>
        </header>

        <main className="space-y-12 px-6 py-8 sm:px-10 sm:py-12">
          <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <div className="h-10 w-64 animate-pulse rounded-2xl bg-[var(--color-canvas)]" />
              <div className="h-10 w-48 animate-pulse rounded-2xl bg-[var(--color-canvas)]" />
            </div>
            <div className="flex gap-3">
              <div className="h-12 w-28 animate-pulse rounded-full bg-[var(--color-canvas)]" />
              <div className="h-12 w-28 animate-pulse rounded-full bg-[var(--color-canvas)]" />
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-[32px] bg-[var(--color-canvas)]" />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
