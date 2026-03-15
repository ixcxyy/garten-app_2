'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Save, Loader2, AlertTriangle, Settings, Type, Layout } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

interface GroupSettingsModalProps {
  group: {
    id: string;
    name: string;
    description: string;
  };
  onClose: () => void;
  onUpdated: () => void;
  isDemoMode?: boolean;
  isOwner?: boolean;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ group, onClose, onUpdated, isDemoMode, isOwner = false }) => {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        onUpdated();
        onClose();
        return;
      }

      const { error } = await supabase
        .from('groups')
        .update({ name, description })
        .eq('id', group.id);

      if (error) throw error;
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Update fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push('/dashboard?mode=demo');
        return;
      }

      // Logic for safe deletion (cascading deletes for members/todos if not handled by DB)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Löschen fehlgeschlagen.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-modal-open="true">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl"
        style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-canvas)] text-[var(--color-muted)]">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Einstellungen</h2>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)] transition-transform hover:scale-110">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-8 pt-8" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
          {showDeleteConfirm ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-600">Gruppe löschen?</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Diese Aktion kann nicht rückgängig gemacht werden. Alle Tasks und Mitglieder werden entfernt.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-full h-14 bg-[var(--color-canvas)] font-bold text-[var(--color-muted)]">
                  Abbrechen
                </button>
                <button onClick={handleDelete} className="flex-1 rounded-full h-14 bg-red-500 font-bold text-white shadow-lg active:scale-95 disabled:opacity-50">
                  {isDeleting ? <Loader2 className="mx-auto animate-spin" /> : 'Endgültig löschen'}
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
                  <Type size={14} /> Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 text-[15px] font-medium text-[var(--color-foreground)] transition-all focus:border-[var(--color-brand)] focus:bg-[var(--color-panel)] focus:ring-4 focus:ring-[var(--color-brand-soft)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
                  <Layout size={14} /> Beschreibung
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[18px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 text-[15px] font-medium text-[var(--color-foreground)] transition-all focus:border-[var(--color-brand)] focus:bg-[var(--color-panel)] focus:ring-4 focus:ring-[var(--color-brand-soft)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <Button type="submit" className="flex-1 h-14 gap-2" disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Speichern
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
