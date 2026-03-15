'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';

interface CreateTodoModalProps {
  groupId: string;
  onClose: () => void;
  onCreated: () => void;
  isDemoMode?: boolean;
}

export const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ groupId, onClose, onCreated, isDemoMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        onCreated();
        onClose();
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Nicht angemeldet.');

      const { error } = await supabase.from('todos').insert([{
        group_id: groupId,
        title: title.trim(),
        description: description.trim() || null,
        photo_url: photoUrl,
        status: 'pending',
        creator_id: userData.user.id,
      }]);

      if (error) throw error;

      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="relative w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[17px] font-bold tracking-tight text-[var(--color-foreground)]">
            Neue Aufgabe
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)]"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was steht an?"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3 text-[15px] font-medium placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details ergänzen..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3 text-[15px] font-medium placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Foto (optional)
            </label>
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-3">
              <PhotoUpload
                isDemoMode={isDemoMode}
                onUploadComplete={(url) => setPhotoUrl(url)}
                onRemove={() => setPhotoUrl(null)}
              />
            </div>
          </div>

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
              disabled={isSubmitting || !title.trim()}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand)] py-3.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} strokeWidth={2.5} />}
              {isSubmitting ? 'Erstellen...' : 'Task erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
