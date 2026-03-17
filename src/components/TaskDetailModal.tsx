'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Plus, Trash2, Send, Tag, CheckSquare, MessageCircle,
  AlertTriangle, ArrowUp, ArrowDown, Minus, Loader2, Calendar, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Todo, Label, ChecklistItem, TodoComment, UserProfile } from '@/lib/types';

const PRIORITY_CONFIG = {
  low: { label: 'Niedrig', icon: ArrowDown, color: '#6B7280' },
  normal: { label: 'Normal', icon: Minus, color: '#3B82F6' },
  high: { label: 'Hoch', icon: ArrowUp, color: '#F59E0B' },
  urgent: { label: 'Dringend', icon: AlertTriangle, color: '#EF4444' },
} as const;

const LABEL_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];

function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
  }
}

interface Props {
  todo: Todo;
  groupId: string;
  currentUserId?: string;
  labels?: Label[];
  todoLabels?: string[];
  onClose: () => void;
  onUpdated: () => void;
  isDemoMode?: boolean;
}

export const TaskDetailModal: React.FC<Props> = ({
  todo, groupId, currentUserId, labels: groupLabels = [], todoLabels: initialTodoLabels = [],
  onClose, onUpdated, isDemoMode,
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [comments, setComments] = useState<(TodoComment & { user_profile?: UserProfile })[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>(todo.priority || 'normal');
  const [todoLabelIds, setTodoLabelIds] = useState<string[]>(initialTodoLabels);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [allLabels, setAllLabels] = useState<Label[]>(groupLabels);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(todo.start_date || '');
  const [dueDate, setDueDate] = useState(todo.due_date || '');
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const fetchDetails = useCallback(async () => {
    if (isDemoMode) return;
    const [checkRes, commentRes] = await Promise.all([
      supabase.from('checklists').select('*').eq('todo_id', todo.id).order('position'),
      supabase.from('todo_comments').select('*').eq('todo_id', todo.id).order('created_at', { ascending: true }),
    ]);
    setChecklist(checkRes.data || []);

    const commentsData = commentRes.data || [];
    if (commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase.from('user_profiles').select('*').in('id', userIds);
      const profileMap = (profiles || []).reduce<Record<string, UserProfile>>((acc, p) => {
        acc[p.id] = p; return acc;
      }, {});
      setComments(commentsData.map(c => ({ ...c, user_profile: profileMap[c.user_id] })));
    } else {
      setComments([]);
    }

    const { data: lbls } = await supabase.from('labels').select('*').eq('group_id', groupId);
    setAllLabels(lbls || []);

    const { data: tl } = await supabase.from('todo_labels').select('label_id').eq('todo_id', todo.id);
    setTodoLabelIds((tl || []).map(x => x.label_id));
  }, [todo.id, groupId, isDemoMode]);

  useEffect(() => { void fetchDetails(); }, [fetchDetails]);

  const handlePriorityChange = async (p: typeof priority) => {
    haptic('medium');
    setPriority(p);
    if (!isDemoMode) {
      await supabase.from('todos').update({ priority: p }).eq('id', todo.id);
    }
  };

  const handleDateChange = async (field: 'start_date' | 'due_date', value: string) => {
    haptic();
    if (field === 'start_date') setStartDate(value);
    else setDueDate(value);
    if (!isDemoMode) {
      await supabase.from('todos').update({ [field]: value || null }).eq('id', todo.id);
    }
  };

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    haptic();
    const item = { todo_id: todo.id, title: newCheckItem.trim(), position: checklist.length };
    setChecklist(prev => [...prev, { ...item, id: crypto.randomUUID(), is_completed: false, created_at: '' }]);
    setNewCheckItem('');
    if (!isDemoMode) {
      await supabase.from('checklists').insert(item);
    }
  };

  const handleToggleCheck = async (itemId: string, current: boolean) => {
    haptic('medium');
    setChecklist(prev => prev.map(c => c.id === itemId ? { ...c, is_completed: !current } : c));
    if (!isDemoMode) {
      await supabase.from('checklists').update({ is_completed: !current }).eq('id', itemId);
    }
  };

  const handleDeleteCheck = async (itemId: string) => {
    haptic();
    setChecklist(prev => prev.filter(c => c.id !== itemId));
    if (!isDemoMode) {
      await supabase.from('checklists').delete().eq('id', itemId);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    haptic();
    setSubmitting(true);
    const comment = { todo_id: todo.id, user_id: currentUserId, content: newComment.trim() };
    setComments(prev => [...prev, { ...comment, id: crypto.randomUUID(), created_at: new Date().toISOString() }]);
    setNewComment('');
    if (!isDemoMode) {
      await supabase.from('todo_comments').insert(comment);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    haptic('medium');
    setComments(prev => prev.filter(c => c.id !== commentId));
    if (!isDemoMode) {
      await supabase.from('todo_comments').delete().eq('id', commentId);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    haptic();
    const has = todoLabelIds.includes(labelId);
    if (has) {
      setTodoLabelIds(prev => prev.filter(id => id !== labelId));
      if (!isDemoMode) await supabase.from('todo_labels').delete().eq('todo_id', todo.id).eq('label_id', labelId);
    } else {
      setTodoLabelIds(prev => [...prev, labelId]);
      if (!isDemoMode) await supabase.from('todo_labels').insert({ todo_id: todo.id, label_id: labelId });
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    haptic();
    const label = { group_id: groupId, name: newLabelName.trim(), color: newLabelColor };
    if (!isDemoMode) {
      const { data } = await supabase.from('labels').insert(label).select().single();
      if (data) {
        setAllLabels(prev => [...prev, data]);
        setTodoLabelIds(prev => [...prev, data.id]);
        await supabase.from('todo_labels').insert({ todo_id: todo.id, label_id: data.id });
      }
    } else {
      const newId = crypto.randomUUID();
      setAllLabels(prev => [...prev, { ...label, id: newId, created_at: '' }]);
      setTodoLabelIds(prev => [...prev, newId]);
    }
    setNewLabelName('');
  };

  const checkDone = checklist.filter(c => c.is_completed).length;
  const checkTotal = checklist.length;

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(10,10,8,0.55)", backdropFilter: "blur(4px)" }}
      />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative w-full max-h-[85vh] overflow-y-auto sm:max-w-lg sm:rounded-[28px]"
        style={{
          background: "var(--color-panel)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
              {todo.title}
            </h2>
            {todo.description && (
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                {todo.description}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => { haptic(); onClose(); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
          >
            <X size={18} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Photo in detail view */}
        {todo.photo_url && (
          <div
            className="px-5 pt-4 cursor-pointer"
            onClick={() => setShowLightbox(true)}
          >
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
              <Image
                src={todo.photo_url}
                alt={todo.title}
                width={600}
                height={400}
                className="w-full max-h-52 object-contain"
                style={{ background: "var(--color-interactive-bg)" }}
              />
            </div>
          </div>
        )}

        <div className="px-5 py-4 space-y-5" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>

          {/* Time Range */}
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={14} style={{ color: "var(--color-muted)" }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
                Zeitraum
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--color-subtle)" }}>Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] focus:outline-none"
                  style={{ background: "var(--color-canvas)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
              </div>
              <div className="flex items-end pb-1">
                <Calendar size={14} style={{ color: "var(--color-subtle)" }} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--color-subtle)" }}>Fällig</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDateChange('due_date', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] focus:outline-none"
                  style={{ background: "var(--color-canvas)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
              </div>
            </div>
          </section>

          {/* Labels */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Tag size={14} style={{ color: "var(--color-muted)" }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
                  Labels
                </span>
              </div>
              <button onClick={() => { haptic(); setShowLabelPicker(!showLabelPicker); }}
                className="text-[11px] font-semibold" style={{ color: "var(--color-brand)" }}
              >
                {showLabelPicker ? 'Fertig' : 'Bearbeiten'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allLabels.filter(l => todoLabelIds.includes(l.id)).map(label => (
                <span key={label.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{ background: label.color }}
                >
                  {label.name}
                </span>
              ))}
              {todoLabelIds.length === 0 && !showLabelPicker && (
                <span className="text-[12px]" style={{ color: "var(--color-subtle)" }}>Keine Labels</span>
              )}
            </div>
            <AnimatePresence>
              {showLabelPicker && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-2 overflow-hidden"
                >
                  {allLabels.map(label => (
                    <button key={label.id} onClick={() => handleToggleLabel(label.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 transition-all active:scale-[0.98]"
                      style={{ background: "var(--color-interactive-bg)", border: todoLabelIds.includes(label.id) ? `2px solid ${label.color}` : "2px solid transparent" }}
                    >
                      <div className="h-4 w-4 rounded-full" style={{ background: label.color }} />
                      <span className="text-[13px] font-semibold flex-1 text-left" style={{ color: "var(--color-foreground)" }}>{label.name}</span>
                      {todoLabelIds.includes(label.id) && <Check size={14} style={{ color: label.color }} />}
                    </button>
                  ))}
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1">
                      {LABEL_COLORS.map(c => (
                        <button key={c} onClick={() => { haptic(); setNewLabelColor(c); }}
                          className="h-5 w-5 rounded-full transition-all"
                          style={{ background: c, border: newLabelColor === c ? '2px solid var(--color-foreground)' : '2px solid transparent' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)}
                      placeholder="Neues Label…"
                      className="flex-1 rounded-xl px-3 py-2 text-[13px] focus:outline-none"
                      style={{ background: "var(--color-canvas)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateLabel())}
                    />
                    <button onClick={handleCreateLabel}
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-bold text-white active:scale-95"
                      style={{ background: newLabelColor }}
                    >
                      <Plus size={12} /> Erstellen
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Priority */}
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={14} style={{ color: "var(--color-muted)" }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
                Priorität
              </span>
            </div>
            <div className="flex gap-1.5">
              {(Object.keys(PRIORITY_CONFIG) as (keyof typeof PRIORITY_CONFIG)[]).map(p => {
                const cfg = PRIORITY_CONFIG[p];
                const Icon = cfg.icon;
                const active = priority === p;
                return (
                  <button key={p} onClick={() => handlePriorityChange(p)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl py-2.5 text-[12px] font-bold transition-all active:scale-95"
                    style={{
                      background: active ? cfg.color + '18' : "var(--color-interactive-bg)",
                      border: active ? `1.5px solid ${cfg.color}` : "1.5px solid var(--color-border)",
                      color: active ? cfg.color : "var(--color-muted)",
                    }}
                  >
                    <Icon size={13} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Checklist */}
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckSquare size={14} style={{ color: "var(--color-muted)" }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
                Checkliste
              </span>
              {checkTotal > 0 && (
                <span className="text-[10px] font-bold ml-1" style={{ color: "var(--color-brand)" }}>
                  {checkDone}/{checkTotal}
                </span>
              )}
            </div>
            {checkTotal > 0 && (
              <div className="h-1.5 w-full rounded-full overflow-hidden mb-2" style={{ background: "var(--color-border-strong)" }}>
                <div className="h-full rounded-full transition-all" style={{ background: "var(--color-brand)", width: `${checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0}%` }} />
              </div>
            )}
            <div className="space-y-1">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button onClick={() => handleToggleCheck(item.id, item.is_completed)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all active:scale-90"
                    style={{
                      border: item.is_completed ? "2px solid var(--color-brand)" : "2px solid var(--color-border-strong)",
                      background: item.is_completed ? "var(--color-brand)" : "transparent",
                    }}
                  >
                    {item.is_completed && <Check size={10} color="white" strokeWidth={3} />}
                  </button>
                  <span className={`flex-1 text-[13px] ${item.is_completed ? 'line-through' : ''}`}
                    style={{ color: item.is_completed ? "var(--color-subtle)" : "var(--color-foreground)" }}
                  >
                    {item.title}
                  </span>
                  <button onClick={() => handleDeleteCheck(item.id)}
                    className="opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity p-1"
                    style={{ color: "var(--color-muted)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                placeholder="Neuer Punkt…"
                className="flex-1 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none"
                style={{ background: "var(--color-canvas)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())}
              />
              <button onClick={handleAddCheckItem}
                className="flex h-10 w-10 items-center justify-center rounded-xl active:scale-90"
                style={{ background: "var(--color-brand)", color: "white" }}
              >
                <Plus size={16} />
              </button>
            </div>
          </section>

          {/* Comments */}
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageCircle size={14} style={{ color: "var(--color-muted)" }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
                Kommentare
              </span>
              {comments.length > 0 && (
                <span className="text-[10px] font-bold ml-1" style={{ color: "var(--color-brand)" }}>
                  {comments.length}
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map(c => {
                const name = c.user_profile?.first_name || c.user_profile?.username || 'Unbekannt';
                const isOwn = c.user_id === currentUserId;
                return (
                  <div key={c.id} className="rounded-xl px-3 py-2.5 group relative" style={{ background: "var(--color-interactive-bg)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold" style={{ color: "var(--color-foreground)" }}>{name}</span>
                        <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>
                          {c.created_at ? new Date(c.created_at).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity p-0.5 rounded"
                          style={{ color: "#EF4444" }}
                          title="Löschen"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[13px] mt-0.5" style={{ color: "var(--color-foreground)" }}>{c.content}</p>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-[12px]" style={{ color: "var(--color-subtle)" }}>Noch keine Kommentare</p>
              )}
            </div>
            {currentUserId && (
              <div className="flex gap-2 mt-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Kommentar schreiben…"
                  className="flex-1 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none"
                  style={{ background: "var(--color-canvas)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                />
                <button onClick={handleAddComment} disabled={submitting || !newComment.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-40 active:scale-90"
                  style={{ background: "var(--color-brand)", color: "white" }}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            )}
          </section>
        </div>
      </motion.div>

      {/* Image lightbox */}
      <AnimatePresence>
        {showLightbox && todo.photo_url && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLightbox(false)}
              style={{ backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-4 z-[80] flex items-center justify-center"
              onClick={() => setShowLightbox(false)}
            >
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X size={20} />
              </button>
              <Image
                src={todo.photo_url}
                alt={todo.title}
                width={1200}
                height={900}
                className="max-h-full max-w-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
