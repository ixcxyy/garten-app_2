'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Leaf, ListTodo, CheckCheck, Copy, Check, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Todo, Group } from '@/lib/types';
import { TodoCard } from '@/components/TodoCard';
import { CreateTodoModal } from '@/components/CreateTodoModal';
import { GroupSettingsModal } from '@/components/dashboard/GroupSettingsModal';
import { useNotifications } from '@/hooks/useNotifications';

const MOCK_TODOS: Todo[] = [
  {
    id: '1',
    group_id: 'demo-1',
    title: 'Tomaten gießen',
    description: 'Jeden Morgen wässern, besonders bei Hitze.',
    photo_url: null,
    status: 'pending',
    created_at: new Date().toISOString(),
    creator_id: 'demo',
  },
  {
    id: '2',
    group_id: 'demo-1',
    title: 'Unkraut jäten',
    description: 'Im Kräuterbereich hat sich viel angesammelt.',
    photo_url: null,
    status: 'completed',
    created_at: new Date().toISOString(),
    creator_id: 'demo',
  },
  {
    id: '3',
    group_id: 'demo-1',
    title: 'Kompostdienst Freitag',
    description: null,
    photo_url: null,
    status: 'pending',
    created_at: new Date().toISOString(),
    creator_id: 'demo',
  },
];

function GroupPageContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isDemoMode =
    searchParams.get('mode') === 'demo' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    (typeof id === 'string' && id.startsWith('demo-'));

  const [group, setGroup] = useState<Group | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'done'>('open');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Fetch current user id for notification suppression
  useEffect(() => {
    if (isDemoMode) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [isDemoMode]);

  // Push notifications for new todos in this group
  useNotifications(typeof id === 'string' ? id : undefined, currentUserId);

  const copyInviteLink = () => {
    if (!group?.invite_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${group.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchGroupData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (!isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
      }
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 300));
        setGroup({
          id: id as string,
          name: id === 'demo-1' ? 'Urban Oasis Garden' : id === 'demo-2' ? 'Green Neighbors' : 'Community Orchard',
          description: 'Demo-Gruppe — verbinde Supabase für echte Daten.',
          invite_code: 'DEMO123',
          owner_id: 'demo',
          created_at: new Date().toISOString(),
        } as Group);
        setTodos(MOCK_TODOS);
        return;
      }

      const [{ data: groupData, error: groupError }, { data: todosData, error: todosError }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', id).single(),
        supabase.from('todos').select('*').eq('group_id', id).order('created_at', { ascending: false }),
      ]);

      if (groupError) throw groupError;
      if (todosError) throw todosError;
      setGroup(groupData);
      setTodos(todosData || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isDemoMode, router]);

  useEffect(() => { void fetchGroupData(); }, [fetchGroupData]);

  const toggleTodoComplete = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: newStatus as 'pending' | 'completed' } : t));
    if (isDemoMode) return;
    try {
      const { error } = await supabase.from('todos').update({ status: newStatus }).eq('id', todoId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
      void fetchGroupData();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-canvas)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        >
          <Leaf size={24} style={{ color: "var(--color-brand)" }} />
        </motion.div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "var(--color-canvas)" }}>
        <p className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Gruppe nicht gefunden</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-brand)" }}
        >
          <ArrowLeft size={14} /> Zurück
        </button>
      </div>
    );
  }

  const openTodos = todos.filter(t => t.status === 'pending');
  const doneTodos = todos.filter(t => t.status === 'completed');
  const displayedTodos = activeTab === 'open' ? openTodos : doneTodos;
  const completionPct = todos.length > 0 ? Math.round((doneTodos.length / todos.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-32 overflow-x-hidden" style={{ background: "var(--color-canvas)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(248,243,233,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </motion.button>
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--color-brand)" }}
              >
                Gruppe
              </p>
              <h1
                className="truncate text-[16px] leading-tight tracking-tight"
                style={{
                  color: "var(--color-foreground)",
                  fontFamily: "var(--font-instrument-serif)",
                }}
              >
                {group.name}
              </h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={copyInviteLink}
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
              title="Einladungslink kopieren"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check size={16} style={{ color: "var(--color-brand)" }} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy size={16} strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
            >
              <Settings size={16} strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* Progress + tabs */}
        <div className="px-4 pb-3 space-y-3">
          {/* Progress bar */}
          {todos.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium" style={{ color: "var(--color-subtle)" }}>
                  Fortschritt
                </span>
                <span className="text-[11px] font-bold" style={{ color: "var(--color-brand)" }}>
                  {completionPct}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--color-canvas-alt)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--color-brand)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )}

          {/* Tab pills */}
          <div
            className="flex gap-1.5 rounded-2xl p-1"
            style={{ background: "var(--color-canvas-alt)" }}
          >
            {([
              ['open', 'Offen', openTodos.length] as const,
              ['done', 'Erledigt', doneTodos.length] as const,
            ]).map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 rounded-[14px] py-2 text-[13px] font-semibold transition-colors"
                style={{
                  color: activeTab === tab ? "var(--color-brand)" : "var(--color-subtle)",
                }}
              >
                {activeTab === tab && (
                  <motion.span
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-[14px]"
                    style={{ background: "var(--color-panel)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">
                  {label}
                  {count > 0 && (
                    <span
                      className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: activeTab === tab ? "var(--color-brand-soft)" : "transparent",
                        color: activeTab === tab ? "var(--color-brand)" : "var(--color-subtle)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Todo list */}
      <main className="px-4 pt-4 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {displayedTodos.length === 0 ? (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col items-center rounded-3xl py-16 text-center"
              style={{
                background: "var(--color-panel)",
                border: "2px dashed var(--color-border)",
              }}
            >
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "var(--color-canvas-alt)", color: "var(--color-subtle)" }}
              >
                {activeTab === 'open' ? <ListTodo size={22} strokeWidth={1.5} /> : <CheckCheck size={22} strokeWidth={1.5} />}
              </div>
              <p className="text-[15px] font-semibold" style={{ color: "var(--color-foreground)" }}>
                {activeTab === 'open' ? 'Keine offenen Aufgaben' : 'Noch nichts erledigt'}
              </p>
              {activeTab === 'open' && (
                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                  Tippe auf + um eine Aufgabe hinzuzufügen
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`list-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <AnimatePresence mode="popLayout">
                {displayedTodos.map(todo => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleTodoComplete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <AnimatePresence>
        {activeTab === 'open' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-28 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white"
            style={{
              background: "var(--color-brand)",
              boxShadow: "var(--shadow-brand)",
            }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <CreateTodoModal
            groupId={id as string}
            onClose={() => setIsModalOpen(false)}
            onCreated={fetchGroupData}
            isDemoMode={isDemoMode}
          />
        )}
        {isSettingsOpen && (
          <GroupSettingsModal
            group={group as any}
            onClose={() => setIsSettingsOpen(false)}
            onUpdated={fetchGroupData}
            isDemoMode={isDemoMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GroupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-canvas)" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
            <Leaf size={24} style={{ color: "var(--color-brand)" }} />
          </motion.div>
        </div>
      }
    >
      <GroupPageContent />
    </Suspense>
  );
}
