'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Loader2, BarChart3, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreatePollModalProps {
  groupId: string;
  onClose: () => void;
  onCreated: () => void;
  isDemoMode?: boolean;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ groupId, onClose, onCreated, isDemoMode }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const validOptions = options.filter(o => o.trim());
  const canSubmit = question.trim() && validOptions.length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        onCreated();
        onClose();
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Nicht angemeldet.');

      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({ group_id: groupId, question: question.trim(), created_by: userData.user.id })
        .select('id')
        .single();

      if (pollError) throw pollError;

      const { error: optError } = await supabase
        .from('poll_options')
        .insert(validOptions.map(label => ({ poll_id: poll.id, label: label.trim() })));

      if (optError) throw optError;

      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
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
        className="relative w-full sm:max-w-md sm:rounded-[28px]"
        style={{
          background: "var(--color-panel)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "var(--shadow-modal)",
          maxHeight: '90dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "var(--color-brand-soft)" }}
            >
              <BarChart3 size={15} style={{ color: "var(--color-brand)" }} />
            </div>
            <h2
              className="text-[17px] font-semibold tracking-tight"
              style={{ color: "var(--color-foreground)" }}
            >
              Neue Abstimmung
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
          >
            <X size={16} strokeWidth={2.5} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 pt-4 space-y-4" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' } as React.CSSProperties}>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
              Frage *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Worüber abstimmen?"
              className="w-full rounded-2xl px-4 py-3.5 text-[15px] font-medium placeholder:text-[var(--color-subtle)] transition-all focus:outline-none"
              style={{ background: "var(--color-canvas)", border: "1.5px solid var(--color-border)", color: "var(--color-foreground)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-subtle)" }}>
              Optionen (mind. 2)
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-2xl px-4 py-3 text-[15px] font-medium placeholder:text-[var(--color-subtle)] transition-all focus:outline-none"
                    style={{ background: "var(--color-canvas)", border: "1.5px solid var(--color-border)", color: "var(--color-foreground)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
                  />
                  {options.length > 2 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.88 }}
                      onClick={() => removeOption(i)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ color: "var(--color-danger)", background: "var(--color-danger-soft)" }}
                    >
                      <Trash2 size={13} />
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={addOption}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-[13px] font-semibold"
                style={{ background: "var(--color-canvas)", border: "1.5px dashed var(--color-border)", color: "var(--color-muted)" }}
              >
                <Plus size={14} /> Option hinzufügen
              </motion.button>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="flex-1 rounded-2xl py-3.5 text-[14px] font-semibold"
              style={{ background: "var(--color-canvas)", border: "1.5px solid var(--color-border)", color: "var(--color-muted)" }}
            >
              Abbrechen
            </motion.button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={isSubmitting || !canSubmit}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--color-brand)", boxShadow: canSubmit ? "var(--shadow-brand)" : "none" }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              {isSubmitting ? 'Erstellen…' : 'Abstimmung starten'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
