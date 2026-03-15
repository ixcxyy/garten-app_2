'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Loader2, Users, Layout, Type, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';

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

  // Helper to generate a unique invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return JSON.stringify(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isDemoMode) {
        // Simulate a delay for demo mode
        await new Promise(resolve => setTimeout(resolve, 800));
        onCreated('demo-new-' + Date.now());
        onClose();
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du bist nicht angemeldet. Bitte logge dich ein.');
      }

      let groupId = '';
      let groupError: { code?: string; message?: string } | null = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const nextGroupId = crypto.randomUUID();
        const inviteCode = generateInviteCode();
        const { error } = await supabase
          .from('groups')
          .insert([
            {
              id: nextGroupId,
              name: name.trim(),
              description: description.trim() || null,
              invite_code: inviteCode,
              owner_id: user.id,
            },
          ]);

        if (!error) {
          groupId = nextGroupId;
          groupError = null;
          break;
        }

        groupError = error;

        if (error.code !== '23505') {
          break;
        }
      }

      if (groupError || !groupId) {
        console.error('Supabase Group Error:', groupError);
        throw new Error(groupError?.message || 'Fehler beim Erstellen der Gruppe im Backend.');
      }

      // 2. Add creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            user_id: user.id,
            role: 'owner',
          },
        ]);

      if (memberError) {
        console.error('Supabase Member Error:', memberError);
        throw new Error(memberError.message || 'Fehler beim Hinzufügen des Mitglieds.');
      }

      onCreated(groupId);
      onClose();
    } catch (error: unknown) {
      console.error('Error creating group:', error);
      setErrorMessage(getErrorMessage(error));
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              <Plus size={20} strokeWidth={3} />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)]">Neue Gruppe</h2>
          </div>
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
              <label className="mb-2 flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--color-muted)]">
                <Type size={14} />
                Name der Gruppe
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Mein Urban Jungle"
                className="w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 text-[15px] font-medium transition-all placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white focus:ring-4 focus:ring-[var(--color-brand-soft)]"
                required
                autoFocus
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <label className="mb-2 flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--color-muted)]">
                <Layout size={14} />
                Beschreibung (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Worum geht es in deiner Gruppe?"
                rows={4}
                className="w-full resize-none rounded-[22px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 text-[15px] font-medium transition-all placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white focus:ring-4 focus:ring-[var(--color-brand-soft)]"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              className="rounded-[22px] bg-[var(--color-brand-soft)]/50 p-5 mt-4"
            >
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-brand)] shadow-soft">
                  <Users size={18} />
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">
                  Nach dem Erstellen erhältst du einen Einladungs-Link, den du mit deinen Mitgärtnern teilen kannst.
                </p>
              </div>
            </motion.div>

            {errorMessage ? (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="rounded-[22px] border border-red-200 bg-red-50 p-4 text-red-700"
              >
                <div className="flex gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            ) : null}
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
              disabled={isSubmitting || !name.trim()}
              className="flex-[2] h-14 gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Plus size={20} strokeWidth={3} />
              )}
              {isSubmitting ? 'Wird erstellt...' : 'Gruppe erstellen'}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};
