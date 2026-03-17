'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Leaf, ListTodo, CheckCheck, Copy, Check, Settings, BarChart3, Users, EyeOff, Eye, LayoutGrid, List, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Todo, Group, Poll, TaskReaction, UserProfile, GroupMember, Label } from '@/lib/types';
import { TodoCard } from '@/components/TodoCard';
import { CreateTodoModal } from '@/components/CreateTodoModal';
import { CreatePollModal } from '@/components/CreatePollModal';
import { PollCard } from '@/components/PollCard';
import { GroupSettingsModal } from '@/components/dashboard/GroupSettingsModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { useNotifications } from '@/hooks/useNotifications';

type AssigneeMap = Record<string, { user_id: string; user_profile?: UserProfile }[]>;
type ReactionMap = Record<string, TaskReaction[]>;
type AssignedSet = Set<string>;

const MOCK_TODOS: Todo[] = [
  {
    id: '1',
    group_id: 'demo-1',
    title: 'Tomaten gießen',
    description: 'Jeden Morgen wässern, besonders bei Hitze.',
    photo_url: null,
    start_date: null,
    due_date: null,
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
    start_date: null,
    due_date: null,
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
    start_date: null,
    due_date: '2026-03-21',
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
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'done' | 'polls' | 'members'>('open');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [hideCompleted, setHideCompleted] = useState(false);
  const [members, setMembers] = useState<(GroupMember & { user_profile?: UserProfile })[]>([]);
  const [assigneeMap, setAssigneeMap] = useState<AssigneeMap>({});
  const [reactionMap, setReactionMap] = useState<ReactionMap>({});
  const [myAssignments, setMyAssignments] = useState<AssignedSet>(new Set());
  const [groupLabels, setGroupLabels] = useState<Label[]>([]);
  const [todoLabelMap, setTodoLabelMap] = useState<Record<string, Label[]>>({});
  const [checklistMap, setChecklistMap] = useState<Record<string, { done: number; total: number }>>({});
  const [detailTodo, setDetailTodo] = useState<Todo | null>(null);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [boardTransform, setBoardTransform] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const saved = localStorage.getItem('hide_completed');
    if (saved !== null) setHideCompleted(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('hide_completed', hideCompleted.toString());
  }, [hideCompleted]);

  useEffect(() => {
    if (isDemoMode) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [isDemoMode]);

  useNotifications(typeof id === 'string' ? id : undefined, currentUserId, { autoSubscribe: false });

  const copyInviteLink = () => {
    if (!group?.invite_code) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${group.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchGroupData = useCallback(async () => {
    if (!id) return;
    // Only show full loading state on first load
    if (!group) setLoading(true);
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

      const { data: groupData, error: groupError } = await supabase
        .from('groups').select('*').eq('id', id).single();

      if (groupError) {
        await new Promise(r => setTimeout(r, 500));
        const { data: retryGroup, error: retryError } = await supabase
          .from('groups').select('*').eq('id', id).single();
        if (retryError) throw retryError;
        setGroup(retryGroup);
      } else {
        setGroup(groupData);
      }

      // Fetch todos, members, assignees, reactions in parallel
      const [todosRes, membersRes] = await Promise.all([
        supabase.from('todos').select('*').eq('group_id', id).order('created_at', { ascending: false }),
        supabase.from('group_members').select('user_id, role, joined_at, group_id').eq('group_id', id),
      ]);

      const todosData = todosRes.data || [];
      setTodos(todosData);

      // Fetch member profiles
      const memberRows = membersRes.data || [];
      if (memberRows.length > 0) {
        const memberIds = memberRows.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles').select('*').in('id', memberIds);
        const profileMap = (profiles || []).reduce<Record<string, UserProfile>>((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
        setMembers(memberRows.map(m => ({ ...m, user_profile: profileMap[m.user_id] })));
      }

      // Fetch assignees and reactions for all todos
      const todoIds = todosData.map(t => t.id);
      if (todoIds.length > 0) {
        const [assigneesRes, reactionsRes] = await Promise.all([
          supabase.from('task_assignees').select('todo_id, user_id').in('todo_id', todoIds),
          supabase.from('task_reactions').select('*').in('todo_id', todoIds),
        ]);

        // Build assignee map with profiles
        const assigneeRows = assigneesRes.data || [];
        const assigneeUserIds = [...new Set(assigneeRows.map(a => a.user_id))];
        let assigneeProfiles: Record<string, UserProfile> = {};
        if (assigneeUserIds.length > 0) {
          const { data: aProfiles } = await supabase
            .from('user_profiles').select('*').in('id', assigneeUserIds);
          assigneeProfiles = (aProfiles || []).reduce<Record<string, UserProfile>>((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }

        const aMap: AssigneeMap = {};
        const mySet = new Set<string>();
        for (const a of assigneeRows) {
          if (!aMap[a.todo_id]) aMap[a.todo_id] = [];
          aMap[a.todo_id].push({ user_id: a.user_id, user_profile: assigneeProfiles[a.user_id] });
          if (currentUserId && a.user_id === currentUserId) mySet.add(a.todo_id);
        }
        setAssigneeMap(aMap);
        setMyAssignments(mySet);

        // Build reaction map
        const rMap: ReactionMap = {};
        for (const r of (reactionsRes.data || [])) {
          if (!rMap[r.todo_id]) rMap[r.todo_id] = [];
          rMap[r.todo_id].push(r);
        }
        setReactionMap(rMap);
      }

      // Fetch labels, todo_labels, checklist progress, and comment counts
      const [labelsRes, todoLabelsRes, checklistRes, commentsRes] = await Promise.all([
        supabase.from('labels').select('*').eq('group_id', id),
        todoIds.length > 0 ? supabase.from('todo_labels').select('todo_id, label_id').in('todo_id', todoIds) : Promise.resolve({ data: [] }),
        todoIds.length > 0 ? supabase.from('checklists').select('todo_id, is_completed').in('todo_id', todoIds) : Promise.resolve({ data: [] }),
        todoIds.length > 0 ? supabase.from('todo_comments').select('todo_id').in('todo_id', todoIds) : Promise.resolve({ data: [] }),
      ]);

      const allLabels = labelsRes.data || [];
      setGroupLabels(allLabels);
      const labelById = allLabels.reduce<Record<string, Label>>((acc, l) => { acc[l.id] = l; return acc; }, {});

      const tlMap: Record<string, Label[]> = {};
      for (const tl of (todoLabelsRes.data || [])) {
        if (!tlMap[tl.todo_id]) tlMap[tl.todo_id] = [];
        if (labelById[tl.label_id]) tlMap[tl.todo_id].push(labelById[tl.label_id]);
      }
      setTodoLabelMap(tlMap);

      const clMap: Record<string, { done: number; total: number }> = {};
      for (const cl of (checklistRes.data || [])) {
        if (!clMap[cl.todo_id]) clMap[cl.todo_id] = { done: 0, total: 0 };
        clMap[cl.todo_id].total++;
        if (cl.is_completed) clMap[cl.todo_id].done++;
      }
      setChecklistMap(clMap);

      const ccMap: Record<string, number> = {};
      for (const c of (commentsRes.data || [])) {
        ccMap[c.todo_id] = (ccMap[c.todo_id] || 0) + 1;
      }
      setCommentCountMap(ccMap);

      // Fetch polls
      const { data: pollsData } = await supabase
        .from('polls').select('*').eq('group_id', id).order('created_at', { ascending: false });
      setPolls(pollsData || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isDemoMode, router, currentUserId]);

  useEffect(() => { void fetchGroupData(); }, [fetchGroupData]);

  // Realtime subscriptions for live updates
  useEffect(() => {
    if (isDemoMode || !id) return;

    const channel = supabase
      .channel(`group-realtime-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `group_id=eq.${id}` }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reactions' }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklists' }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_comments' }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_labels' }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labels', filter: `group_id=eq.${id}` }, () => {
        void fetchGroupData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `group_id=eq.${id}` }, () => {
        void fetchGroupData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, isDemoMode, fetchGroupData]);

  const toggleTodoComplete = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    // Optimistic update
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: newStatus as 'pending' | 'completed' } : t));
    
    if (isDemoMode) return;
    
    try {
      const { error, data } = await supabase
        .from('todos')
        .update({ status: newStatus })
        .eq('id', todoId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No rows updated');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      void fetchGroupData();
    }
  };

  const handleAssign = async (todoId: string) => {
    if (!currentUserId || isDemoMode) return;
    setMyAssignments(prev => new Set(prev).add(todoId));
    setAssigneeMap(prev => ({
      ...prev,
      [todoId]: [...(prev[todoId] || []), { user_id: currentUserId }],
    }));
    await supabase.from('task_assignees').insert({ todo_id: todoId, user_id: currentUserId });
  };

  const handleUnassign = async (todoId: string) => {
    if (!currentUserId || isDemoMode) return;
    setMyAssignments(prev => { const s = new Set(prev); s.delete(todoId); return s; });
    setAssigneeMap(prev => ({
      ...prev,
      [todoId]: (prev[todoId] || []).filter(a => a.user_id !== currentUserId),
    }));
    await supabase.from('task_assignees').delete().eq('todo_id', todoId).eq('user_id', currentUserId);
  };

  const handleReact = async (todoId: string, emoji: string) => {
    if (!currentUserId || isDemoMode) return;
    setReactionMap(prev => ({
      ...prev,
      [todoId]: [...(prev[todoId] || []), { id: '', todo_id: todoId, user_id: currentUserId, emoji, created_at: '' }],
    }));
    await supabase.from('task_reactions').insert({ todo_id: todoId, user_id: currentUserId, emoji });
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (isDemoMode) return;
    setTodos(prev => prev.filter(t => t.id !== todoId));
    await supabase.from('todos').delete().eq('id', todoId);
  };

  const handleUnreact = async (todoId: string, emoji: string) => {
    if (!currentUserId || isDemoMode) return;
    setReactionMap(prev => ({
      ...prev,
      [todoId]: (prev[todoId] || []).filter(r => !(r.user_id === currentUserId && r.emoji === emoji)),
    }));
    await supabase.from('task_reactions').delete().eq('todo_id', todoId).eq('user_id', currentUserId).eq('emoji', emoji);
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
  const unfilteredTodos = activeTab === 'open' ? openTodos : activeTab === 'done' ? (hideCompleted ? [] : doneTodos) : [];
  const displayedTodos = filterLabel
    ? unfilteredTodos.filter(t => (todoLabelMap[t.id] || []).some(l => l.id === filterLabel))
    : unfilteredTodos;
  const dueTodos = todos.filter(t => t.due_date !== null);
  const doneDueTodos = dueTodos.filter(t => t.status === 'completed');
  const completionPct = dueTodos.length > 0 ? Math.round((doneDueTodos.length / dueTodos.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-32 overflow-x-hidden" style={{ background: "var(--color-canvas)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-header-bg)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--color-interactive-bg)",
                border: "1px solid var(--color-interactive-border)",
                color: "var(--color-foreground)",
              }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </motion.button>
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--color-subtle)" }}
              >
                Gruppe
              </p>
              <h1
                className="truncate text-[16px] leading-tight tracking-tight"
                style={{ color: "var(--color-foreground)", letterSpacing: "-0.02em", fontWeight: 600 }}
              >
                {group.name}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* View mode toggle */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setViewMode(viewMode === 'list' ? 'board' : 'list')}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{
                background: viewMode === 'board' ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                border: viewMode === 'board' ? "1px solid var(--color-brand)" : "1px solid var(--color-interactive-border)",
                color: viewMode === 'board' ? "var(--color-brand)" : "var(--color-muted)",
              }}
              title={viewMode === 'list' ? 'Board-Ansicht' : 'Listen-Ansicht'}
            >
              {viewMode === 'list' ? <LayoutGrid size={16} strokeWidth={2} /> : <List size={16} strokeWidth={2} />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={copyInviteLink}
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{
                background: "var(--color-interactive-bg)",
                border: "1px solid var(--color-interactive-border)",
                color: "var(--color-muted)",
              }}
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
              style={{
                background: "var(--color-interactive-bg)",
                border: "1px solid var(--color-interactive-border)",
                color: "var(--color-muted)",
              }}
            >
              <Settings size={16} strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* Progress + tabs */}
        <div className="px-4 pb-3 space-y-3">
          {todos.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium" style={{ color: "var(--color-subtle)" }}>
                  Fortschritt
                </span>
                <span className="text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>
                  {completionPct}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--color-border-strong)" }}
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
            className="flex gap-1 rounded-2xl p-1"
            style={{
              background: "var(--color-interactive-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            {([
              ['open', 'Offen', openTodos.length] as const,
              ['done', 'Erledigt', doneTodos.length] as const,
              ['polls', 'Abstimmungen', polls.length] as const,
              ['members', 'Mitglieder', members.length] as const,
            ]).map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 rounded-[14px] py-2 text-[12px] font-semibold transition-colors"
                style={{
                  color: activeTab === tab ? "var(--color-foreground)" : "var(--color-muted)",
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
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
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

      {/* Content */}
      <main className="px-4 pt-3 overflow-x-hidden">
        {/* Label filter bar */}
        {(activeTab === 'open' || activeTab === 'done') && groupLabels.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterLabel(null)}
              className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition-all"
              style={{
                background: !filterLabel ? "var(--color-foreground)" : "var(--color-interactive-bg)",
                color: !filterLabel ? "var(--color-panel)" : "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              Alle
            </button>
            {groupLabels.map(label => (
              <button
                key={label.id}
                onClick={() => setFilterLabel(filterLabel === label.id ? null : label.id)}
                className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold text-white transition-all active:scale-95"
                style={{
                  background: filterLabel === label.id ? label.color : label.color + '40',
                  color: filterLabel === label.id ? 'white' : label.color,
                  border: `1px solid ${label.color}${filterLabel === label.id ? '' : '60'}`,
                }}
              >
                {label.name}
              </button>
            ))}
          </div>
        )}

        {/* Hide completed toggle for done tab */}
        {activeTab === 'done' && doneTodos.length > 0 && (
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
              style={{
                background: hideCompleted ? "var(--color-brand-soft)" : "var(--color-interactive-bg)",
                color: hideCompleted ? "var(--color-brand)" : "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {hideCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
              {hideCompleted ? "Einblenden" : "Ausblenden"}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'members' ? (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              {members.map((member) => {
                const profile = member.user_profile;
                const displayName = profile?.first_name
                  ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
                  : profile?.username || 'Unbekannt';
                const initial = displayName.charAt(0).toUpperCase();
                const isOwner = member.role === 'owner';

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                    style={{
                      background: "var(--color-panel)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                      style={{
                        background: "var(--color-brand-soft)",
                        color: "var(--color-brand)",
                      }}
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold"
                          style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
                        >
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold" style={{ color: "var(--color-foreground)", letterSpacing: "-0.01em" }}>
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2">
                        {profile?.username && (
                          <p className="text-[12px] opacity-60" style={{ color: "var(--color-muted)" }}>
                            @{profile.username}
                          </p>
                        )}
                        {member.joined_at && (
                          <span className="text-[10px] opacity-40" style={{ color: "var(--color-muted)" }}>
                            · {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {isOwner ? (
                      <div
                        className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                        style={{
                          background: "var(--color-brand-soft)",
                          color: "var(--color-brand)",
                          border: "1px solid var(--color-interactive-border)",
                        }}
                      >
                        <Settings size={10} />
                        Leitung
                      </div>
                    ) : (
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: "var(--color-interactive-bg)",
                          color: "var(--color-subtle)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        Mitglied
                      </span>
                    )}
                  </div>
                );
              })}
              {members.length === 0 && (
                <div className="mt-10 flex flex-col items-center rounded-2xl py-16 text-center"
                  style={{ background: "var(--color-panel)", border: "1px dashed var(--color-border-strong)" }}
                >
                  <Users size={22} style={{ color: "var(--color-muted)" }} />
                  <p className="mt-3 text-[15px] font-semibold" style={{ color: "var(--color-foreground)" }}>
                    Keine Mitglieder
                  </p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'polls' ? (
            polls.length === 0 ? (
              <motion.div
                key="empty-polls"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-10 flex flex-col items-center rounded-2xl py-16 text-center"
                style={{ background: "var(--color-panel)", border: "1px dashed var(--color-border-strong)" }}
              >
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "var(--color-interactive-bg)", border: "1px solid var(--color-interactive-border)", color: "var(--color-muted)" }}
                >
                  <BarChart3 size={22} strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-semibold" style={{ color: "var(--color-foreground)" }}>Keine Abstimmungen</p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>Tippe auf + um eine Abstimmung zu starten</p>
              </motion.div>
            ) : (
              <motion.div key="polls-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {polls.map(poll => (
                    <PollCard key={poll.id} poll={poll} currentUserId={currentUserId} onDeleted={fetchGroupData} isDemoMode={isDemoMode} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )
          ) : viewMode === 'board' && (activeTab === 'open' || activeTab === 'done') ? (
            <motion.div
              key={`board-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
              style={{ height: 'calc(100vh - 260px)' }}
            >
              {/* Zoom controls */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                <button
                  onClick={() => setBoardTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 2.5) }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setBoardTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.3) }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={() => setBoardTransform({ x: 0, y: 0, scale: 1 })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[9px] font-bold"
                  style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                >
                  1:1
                </button>
              </div>

              {/* Canvas area */}
              <div
                className="w-full h-full overflow-hidden rounded-xl touch-none"
                style={{ background: "var(--color-canvas-alt, var(--color-interactive-bg))", border: "1px solid var(--color-border)" }}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest('[data-card]')) return;
                  const startX = e.clientX - boardTransform.x;
                  const startY = e.clientY - boardTransform.y;
                  const onMove = (ev: PointerEvent) => {
                    setBoardTransform(prev => ({ ...prev, x: ev.clientX - startX, y: ev.clientY - startY }));
                  };
                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                  };
                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setBoardTransform(prev => ({
                    ...prev,
                    scale: Math.min(2.5, Math.max(0.3, prev.scale + delta)),
                  }));
                }}
              >
                <div
                  style={{
                    transform: `translate(${boardTransform.x}px, ${boardTransform.y}px) scale(${boardTransform.scale})`,
                    transformOrigin: '0 0',
                    transition: 'none',
                  }}
                  className="p-6"
                >
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {displayedTodos.map(todo => (
                      <div key={todo.id} data-card>
                        <TodoCard
                          todo={todo}
                          onToggleComplete={toggleTodoComplete}
                          currentUserId={currentUserId}
                          assignees={assigneeMap[todo.id] || []}
                          reactions={reactionMap[todo.id] || []}
                          labels={todoLabelMap[todo.id] || []}
                          checklistProgress={checklistMap[todo.id]}
                          commentCount={commentCountMap[todo.id] || 0}
                          isAssigned={myAssignments.has(todo.id)}
                          onAssign={() => handleAssign(todo.id)}
                          onUnassign={() => handleUnassign(todo.id)}
                          onReact={(emoji) => handleReact(todo.id, emoji)}
                          onUnreact={(emoji) => handleUnreact(todo.id, emoji)}
                          onTitleClick={() => setDetailTodo(todo)}
                          isDemoMode={isDemoMode}
                        />
                      </div>
                    ))}
                  </div>
                  {displayedTodos.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-[14px] font-medium" style={{ color: "var(--color-muted)" }}>
                      Keine Aufgaben
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : displayedTodos.length === 0 ? (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col items-center rounded-2xl py-16 text-center"
              style={{ background: "var(--color-panel)", border: "1px dashed var(--color-border-strong)" }}
            >
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "var(--color-interactive-bg)", border: "1px solid var(--color-interactive-border)", color: "var(--color-muted)" }}
              >
                {activeTab === 'open' ? <ListTodo size={22} strokeWidth={1.5} /> : <CheckCheck size={22} strokeWidth={1.5} />}
              </div>
              <p className="text-[15px] font-semibold" style={{ color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>
                {activeTab === 'open' ? 'Keine offenen Aufgaben' : hideCompleted ? 'Erledigte ausgeblendet' : 'Noch nichts erledigt'}
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
                    currentUserId={currentUserId}
                    assignees={assigneeMap[todo.id] || []}
                    reactions={reactionMap[todo.id] || []}
                    labels={todoLabelMap[todo.id] || []}
                    checklistProgress={checklistMap[todo.id]}
                    commentCount={commentCountMap[todo.id] || 0}
                    isAssigned={myAssignments.has(todo.id)}
                    onAssign={() => handleAssign(todo.id)}
                    onUnassign={() => handleUnassign(todo.id)}
                    onReact={(emoji) => handleReact(todo.id, emoji)}
                    onUnreact={(emoji) => handleUnreact(todo.id, emoji)}
                    onTitleClick={() => setDetailTodo(todo)}
                    onDelete={() => handleDeleteTodo(todo.id)}
                    isDemoMode={isDemoMode}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB with menu */}
      <AnimatePresence>
        {showFabMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10"
            onClick={() => setShowFabMenu(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-28 right-4 z-20 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showFabMenu && (
            <>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowFabMenu(false); setIsPollModalOpen(true); }}
                className="flex items-center gap-2.5 rounded-full px-4 py-3"
                style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-modal)" }}
              >
                <BarChart3 size={16} style={{ color: "var(--color-brand)" }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--color-foreground)" }}>Abstimmung</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowFabMenu(false); setIsModalOpen(true); }}
                className="flex items-center gap-2.5 rounded-full px-4 py-3"
                style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-modal)" }}
              >
                <ListTodo size={16} style={{ color: "var(--color-brand)" }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--color-foreground)" }}>Aufgabe</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFabMenu(!showFabMenu)}
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "var(--color-fab-bg)",
            color: "var(--color-fab-fg)",
            boxShadow: "var(--shadow-brand-lg)",
          }}
        >
          <motion.div animate={{ rotate: showFabMenu ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={24} strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateTodoModal
            groupId={id as string}
            onClose={() => setIsModalOpen(false)}
            onCreated={fetchGroupData}
            isDemoMode={isDemoMode}
          />
        )}
        {isPollModalOpen && (
          <CreatePollModal
            groupId={id as string}
            onClose={() => setIsPollModalOpen(false)}
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
            isOwner={currentUserId === group?.owner_id}
          />
        )}
        {detailTodo && (
          <TaskDetailModal
            todo={detailTodo}
            groupId={id as string}
            currentUserId={currentUserId}
            labels={groupLabels}
            todoLabels={(todoLabelMap[detailTodo.id] || []).map(l => l.id)}
            onClose={() => setDetailTodo(null)}
            onUpdated={() => { setDetailTodo(null); fetchGroupData(); }}
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
