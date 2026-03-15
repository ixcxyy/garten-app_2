'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';
import { Button } from './ui/Button';

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
        await new Promise(resolve => setTimeout(resolve, 800));
        onCreated();
        onClose();
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Nicht angemeldet.');
      
      const { error } = await supabase
        .from('todos')
        .insert([
          {
            group_id: groupId,
            title,
            description,
            photo_url: photoUrl,
            status: 'pending',
            creator_id: userData.user?.id,
          },
        ]);

      if (error) throw error;

      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }
        }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/5"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-8 py-6">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)]">Neuer Task</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)] transition-transform hover:scale-110 active:scale-90"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <motion.form 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
              }
            }
          }}
          onSubmit={handleSubmit} 
          className="p-8"
        >
          <div className="space-y-6">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="mb-2 block text-sm font-bold tracking-tight text-[var(--color-muted)]">
                Titel
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Was steht an?"
                className="w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 text-[15px] font-medium transition-all placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white focus:ring-4 focus:ring-[var(--color-brand-soft)]"
                required
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="mb-2 block text-sm font-bold tracking-tight text-[var(--color-muted)]">
                Beschreibung (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details hinzufügen..."
                rows={3}
                className="w-full resize-none rounded-[18px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 text-[15px] font-medium transition-all placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white focus:ring-4 focus:ring-[var(--color-brand-soft)]"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="mb-3 block text-sm font-bold tracking-tight text-[var(--color-muted)]">
                Foto ergänzen
              </label>
              <div className="rounded-[24px] border-2 border-dashed border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-brand-soft)]">
                <PhotoUpload 
                  isDemoMode={isDemoMode}
                  onUploadComplete={(url) => setPhotoUrl(url)}
                  onRemove={() => setPhotoUrl(null)}
                />
              </div>
            </motion.div>
          </div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="mt-10 flex gap-3"
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full h-14 text-sm font-extrabold text-[var(--color-subtle)] transition-colors hover:bg-[var(--color-canvas)] active:scale-95"
            >
              Abbrechen
            </button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-[2] h-14 gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Plus size={20} strokeWidth={3} />
              )}
              {isSubmitting ? 'Wird erstellt...' : 'Task erstellen'}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};
