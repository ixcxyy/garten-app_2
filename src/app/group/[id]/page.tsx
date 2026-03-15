'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Loader2, ListTodo, Users, Settings, UserPlus, Check, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Todo, Group } from '@/lib/types';
import { TodoCard } from '@/components/TodoCard';
import { CreateTodoModal } from '@/components/CreateTodoModal';
import { AnimatedButton } from '@/components/AnimatedButton';

export default function GroupPage() {
  const { id } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    if (!group?.invite_code) return;
    const inviteLink = `${window.location.origin}/invite/${group.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);

  async function fetchGroupData() {
    setLoading(true);
    try {
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
  }

  const toggleTodoComplete = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Optimistic update
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: newStatus as 'pending' | 'completed' } : t));

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

  const handlePhotoUpload = async (todoId: string, photoUrl: string) => {
    // Optimistic update
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, photo_url: photoUrl } : t));

    try {
      const { error } = await supabase
        .from('todos')
        .update({ photo_url: photoUrl })
        .eq('id', todoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating photo:', error);
      fetchGroupData();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Group not found</h1>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{group.name}</h1>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {todos.length} Active Tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedButton 
              onClick={copyInviteLink}
              variant="ghost"
              size="icon"
              className="relative text-zinc-400"
              title="Copy Invite Link"
            >
              {copied ? (
                <Check size={20} className="text-emerald-500" />
              ) : (
                <UserPlus size={20} className="hover:text-emerald-600 transition-colors" />
              )}
              {copied && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-[10px] text-white dark:bg-zinc-800"
                >
                  Copied!
                </motion.span>
              )}
            </AnimatedButton>
            <AnimatedButton variant="ghost" size="icon" className="hidden sm:flex">
              <Users size={20} />
            </AnimatedButton>
            <AnimatedButton variant="ghost" size="icon">
              <Settings size={20} />
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setIsModalOpen(true)}
              className="ml-2 gap-2 bg-emerald-600 px-6"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Task</span>
            </AnimatedButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {todos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 py-20 dark:border-zinc-800"
          >
            <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
              <ListTodo size={40} className="text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No tasks yet</h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">Get started by creating your first group task.</p>
            <AnimatedButton
              onClick={() => setIsModalOpen(true)}
              className="mt-6 gap-2 px-8 py-6 text-base"
            >
              <Plus size={18} /> Create Task
            </AnimatedButton>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {todos.map((todo) => (
                <TodoCard 
                  key={todo.id} 
                  todo={todo} 
                  onToggleComplete={toggleTodoComplete} 
                  onPhotoUpload={handlePhotoUpload}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
