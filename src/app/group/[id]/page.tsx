'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Loader2, ListTodo, CheckCheck, Copy, Check, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Todo, Group } from '@/lib/types';
import { TodoCard } from '@/components/TodoCard';
import { CreateTodoModal } from '@/components/CreateTodoModal';
import { GroupSettingsModal } from '@/components/dashboard/GroupSettingsModal';

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

export default function GroupPage() {
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

  const copyInviteLink = () => {
    if (!group?.invite_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${group.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        await new Promise(r => setTimeout(r, 400));
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
      setGroup(groupData);
      setTodos(todosData || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isDemoMode]);

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)]">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-canvas)]">
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">Gruppe nicht gefunden</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-[var(--color-brand)]"
        >
          <ArrowLeft size={15} /> Zurück
        </button>
      </div>
    );
  }

  const openTodos = todos.filter(t => t.status === 'pending');
  const doneTodos = todos.filter(t => t.status === 'completed');
  const displayedTodos = activeTab === 'open' ? openTodos : doneTodos;

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)] active:scale-95"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">Gruppe</p>
              <h1 className="truncate text-[15px] font-bold tracking-tight text-[var(--color-foreground)]">
                {group.name}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={copyInviteLink}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)] active:scale-95"
              title="Einladungslink kopieren"
            >
              {copied
                ? <Check size={17} className="text-[var(--color-brand)]" strokeWidth={2.5} />
                : <Copy size={17} strokeWidth={2} />
              }
              <AnimatePresence>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--color-foreground)] px-2.5 py-1 text-[10px] font-bold text-white"
                  >
                    Kopiert!
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)] active:scale-95"
            >
              <Settings size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Stats + Tabs */}
        <div className="px-4 pb-3 space-y-2.5">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
              <ListTodo size={14} className="text-amber-500 shrink-0" strokeWidth={2.3} />
              <span className="text-[13px] font-bold text-amber-700">{openTodos.length} offen</span>
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
              <CheckCheck size={14} className="text-emerald-500 shrink-0" strokeWidth={2.3} />
              <span className="text-[13px] font-bold text-emerald-700">{doneTodos.length} erledigt</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {([['open', 'Offen'], ['done', 'Erledigt']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-canvas)] text-[var(--color-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Todo list */}
      <main className="px-4 pt-4">
        {displayedTodos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex flex-col items-center rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-white/50 py-14 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-subtle)]">
              <ListTodo size={22} strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold text-[var(--color-foreground)]">
              {activeTab === 'open' ? 'Keine offenen Aufgaben' : 'Noch nichts erledigt'}
            </p>
            {activeTab === 'open' && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Tippe auf + um eine Aufgabe hinzuzufügen
              </p>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {displayedTodos.map(todo => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={toggleTodoComplete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* FAB */}
      {activeTab === 'open' && (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-[0_8px_24px_rgba(47,106,83,0.4)]"
        >
          <Plus size={24} strokeWidth={2.5} />
        </motion.button>
      )}

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
