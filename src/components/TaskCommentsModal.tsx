"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Todo, TodoComment } from "@/lib/types";

interface TaskCommentsModalProps {
  todo: Todo;
  currentUserId?: string;
  onClose: () => void;
  isDemoMode?: boolean;
}

function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const ms = style === 'light' ? 10 : style === 'medium' ? 20 : 40;
    navigator.vibrate(ms);
  }
}

export default function TaskCommentsModal({
  todo,
  currentUserId,
  onClose,
  isDemoMode = false,
}: TaskCommentsModalProps) {
  const [comments, setComments] = useState<TodoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
  }, [todo.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchComments = async () => {
    if (isDemoMode) {
      setComments([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('todo_comments')
        .select('*, user_profile:profiles(*)')
        .eq('todo_id', todo.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting || !currentUserId) return;
    haptic('light');
    setSubmitting(true);
    
    if (isDemoMode) {
      const demoComment: TodoComment = {
        id: Math.random().toString(),
        todo_id: todo.id,
        user_id: currentUserId,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        user_profile: { id: currentUserId, username: 'You', first_name: 'You', last_name: null, avatar_url: null, created_at: '' }
      };
      setComments([...comments, demoComment]);
      setNewComment("");
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('todo_comments')
        .insert({
          todo_id: todo.id,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select('*, user_profile:profiles(*)')
        .single();

      if (error) throw error;
      setComments([...comments, data]);
      setNewComment("");
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (isDemoMode) {
      setComments(comments.filter(c => c.id !== id));
      return;
    }
    try {
      const { error } = await supabase
        .from('todo_comments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setComments(comments.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative flex h-[500px] w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-[var(--color-panel)] shadow-2xl"
        style={{ border: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold leading-none text-[var(--color-foreground)]">Kommentare</h3>
              <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)] truncate max-w-[200px]">{todo.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-[var(--color-muted)] transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center text-[var(--color-muted)]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-6">
              <div className="mb-3 rounded-full bg-[var(--color-interactive-bg)] p-4 text-[var(--color-subtle)]">
                <MessageCircle size={32} />
              </div>
              <p className="text-[14px] font-semibold text-[var(--color-foreground)]">Keine Kommentare</p>
              <p className="text-[12px] text-[var(--color-muted)] mt-1">Schreibe den ersten Kommentar zu dieser Aufgabe.</p>
            </div>
          ) : (
            comments.map(c => {
               const name = c.user_profile?.first_name || c.user_profile?.username || 'Unbekannt';
               const isOwn = c.user_id === currentUserId;
               return (
                 <div key={c.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                   <div className="flex items-center gap-1.5 mb-1 px-1">
                     <span className="text-[11px] font-bold text-[var(--color-muted)]">{isOwn ? 'Du' : name}</span>
                     <span className="text-[9px] text-[var(--color-subtle)]">
                       {c.created_at ? new Date(c.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}
                     </span>
                   </div>
                   <div 
                    className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-[13px] shadow-sm relative group`}
                    style={{ 
                      background: isOwn ? "var(--color-brand)" : "var(--color-interactive-bg)",
                      color: isOwn ? "white" : "var(--color-foreground)",
                      border: isOwn ? "none" : "1px solid var(--color-border)"
                    }}
                   >
                     {c.content}
                     {isOwn && (
                       <button
                         onClick={() => handleDeleteComment(c.id)}
                         className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-500 transition-opacity"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                 </div>
               );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-panel)]">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Nachricht schreiben…"
              className="flex-1 rounded-full bg-[var(--color-canvas)] px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAddComment())}
            />
            <button
              onClick={handleAddComment}
              disabled={submitting || !newComment.trim()}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-lg active:scale-90 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
