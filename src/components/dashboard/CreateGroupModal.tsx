'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: (groupId: string) => void;
  isDemoMode?: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated, isDemoMode }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        onCreated('demo-new-' + Date.now());
        onClose();
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Du bist nicht angemeldet.');

      let groupId = '';
      let groupError: { code?: string; message?: string } | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const nextGroupId = crypto.randomUUID();
        const { error } = await supabase.from('groups').insert([{
          id: nextGroupId,
          name: name.trim(),
          description: description.trim() || null,
          invite_code: generateInviteCode(),
          owner_id: user.id,
        }]);

        if (!error) { groupId = nextGroupId; break; }
        groupError = error;
        if (error.code !== '23505') break;
      }

      if (!groupId) throw new Error(groupError?.message || 'Fehler beim Erstellen.');

      const { error: memberError } = await supabase.from('group_members').insert([{
        group_id: groupId,
        user_id: user.id,
        role: 'owner',
      }]);

      if (memberError) throw new Error(memberError.message);

      onCreated(groupId);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Bottom sheet / modal */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="relative w-full rounded-t-[28px] shadow-2xl sm:max-w-md sm:rounded-3xl"
        style={{
          background: 'var(--color-panel)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[17px] font-bold tracking-tight text-[var(--color-foreground)]">
            Neue Gruppe
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--color-canvas-alt)', color: 'var(--color-muted)' }}
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 sm:pb-8 space-y-4" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Mein Stadtgarten"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3 text-[15px] font-medium text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Beschreibung (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in dieser Gruppe?"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3 text-[15px] font-medium placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
            />
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[var(--color-border)] py-3.5 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] active:scale-95"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand)] py-3.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-[var(--color-brand-strong)] disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Plus size={17} strokeWidth={2.5} />
              )}
              {isSubmitting ? 'Erstellen...' : 'Gruppe erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
