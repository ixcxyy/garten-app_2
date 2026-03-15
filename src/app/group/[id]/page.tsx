'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Loader2, ListTodo, Users, Settings, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Todo, Group } from '@/lib/types';
import { TodoCard } from '@/components/TodoCard';
import { CreateTodoModal } from '@/components/CreateTodoModal';
import { Button } from '@/components/ui/Button';
import { GroupSettingsModal } from '@/components/dashboard/GroupSettingsModal';
import { useSearchParams } from 'next/navigation';

const MOCK_TODO_DATA: Todo[] = [
  {
    id: '1',
    group_id: 'demo-1',
    title: 'Tomaten gießen',
    description: 'Die Tomaten brauchen jeden Morgen Wasser, besonders bei Hitze.',
    photo_url: null,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    creator_id: 'demo'
  },
  {
    id: '2',
    group_id: 'demo-1',
    title: 'Unkraut jäten',
    description: 'Im Bereich der Kräuter hat sich viel Unkraut angesammelt.',
    photo_url: null,
    status: 'completed' as const,
    created_at: new Date().toISOString(),
    creator_id: 'demo'
  }
];

export default function GroupPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isDemoMode = searchParams.get("mode") === "demo" || 
                     !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
                     (typeof id === 'string' && id.startsWith('demo-'));

  const [group, setGroup] = useState<Group | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    if (!group?.invite_code) return;
    const inviteLink = `${window.location.origin}/invite/${group.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchGroupData = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      if (isDemoMode) {
        // Simulate demo data fetching
        await new Promise(resolve => setTimeout(resolve, 600));
        setGroup({
          id: id as string,
          name: id === 'demo-1' ? 'Urban Oasis Garden' : (id === 'demo-2' ? 'Green Neighbors' : 'Community Orchard'),
          description: 'Dies ist eine Demo-Gruppe. Verbinde Supabase für echte Daten.',
          invite_code: 'DEMO123',
          owner_id: 'demo',
          created_at: new Date().toISOString()
        } as Group);
        setTodos(MOCK_TODO_DATA);
        return;
      }

      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch todos
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      if (todosError) throw todosError;
      setTodos(todosData || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchGroupData();
  }, [fetchGroupData]);

  const toggleTodoComplete = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Optimistic update
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: newStatus as 'pending' | 'completed' } : t));

    if (isDemoMode) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
      // Rollback on error
      fetchGroupData();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-canvas)]">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Gruppe nicht gefunden</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-[var(--color-brand)] hover:text-[var(--color-brand-strong)]"
        >
          <ArrowLeft size={18} /> Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-muted)] shadow-soft transition-transform hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">Gartengruppe</p>
              <h1 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)]">{group.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={copyInviteLink}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-muted)] shadow-soft transition-all hover:scale-105 hover:text-[var(--color-brand)] active:scale-95"
              title="Einladungslink kopieren"
            >
              {copied ? (
                <Check size={20} className="text-[var(--color-brand)]" strokeWidth={3} />
              ) : (
                <UserPlus size={20} strokeWidth={2.5} />
              )}
              <AnimatePresence>
                {copied && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-foreground)] px-3 py-1.5 text-[10px] font-bold text-white whitespace-nowrap"
                  >
                    Kopiert!
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--color-muted)] shadow-soft transition-transform hover:scale-105 active:scale-95"
            >
              <Settings size={20} strokeWidth={2.5} />
            </button>
            
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="ml-2 gap-2"
            >
              <Plus size={18} strokeWidth={3} />
              <span className="hidden sm:inline">Neuer Task</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {todos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-[var(--color-border)] bg-white/40 py-24 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[var(--color-subtle)] shadow-soft">
              <ListTodo size={40} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-foreground)]">Noch keine Aufgaben</h2>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[var(--color-muted)]">
              Euer Garten wartet! Erstelle den ersten Task, um die Pflege gemeinsam zu planen.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-10 h-14 px-10 gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Task erstellen
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {todos.map((todo) => (
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

      <AnimatePresence>
        {isModalOpen && (
          <CreateTodoModal 
            groupId={id as string} 
            onClose={() => setIsModalOpen(false)} 
            onCreated={fetchGroupData}
            isDemoMode={isDemoMode}
          />
        )}
        {isSettingsOpen && group && (
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
