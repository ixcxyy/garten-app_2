'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2, Camera, FileImage, Calendar } from 'lucide-react';
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
  const [dueDate, setDueDate] = useState('');
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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

      const { error } = await supabase.from('todos').insert([{
        group_id: groupId,
        title: title.trim(),
        description: description.trim() || null,
        photo_url: photoUrl,
        due_date: dueDate || null,
        status: 'pending',
        creator_id: userData.user.id,
      }]);

      if (error) throw error;

      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating todo:', err);
      setError(err.message || 'Fehler beim Erstellen der Aufgabe. Bitte prüfe ob die Datenbank-Spalte "due_date" existiert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center sm:p-6" data-modal-open="true">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(10,10,8,0.55)", backdropFilter: "blur(4px)" }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative w-full overflow-hidden sm:max-w-md sm:rounded-[28px]"
        style={{
          background: "var(--color-panel)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div
            className="h-1 w-10 rounded-full"
            style={{ background: "var(--color-border)" }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2
            className="text-[17px] font-semibold tracking-tight"
            style={{
              color: "var(--color-foreground)",
              fontFamily: "var(--font-instrument-serif)",
            }}
          >
            Neue Aufgabe
          </h2>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
          >
            <X size={16} strokeWidth={2.5} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pt-4 space-y-4" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
          {/* Title */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--color-subtle)" }}
            >
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was steht an?"
              className="w-full rounded-2xl px-4 py-3.5 text-[15px] font-medium placeholder:text-[var(--color-subtle)] transition-all focus:outline-none"
              style={{
                background: "var(--color-canvas)",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-brand)";
                e.currentTarget.style.background = "var(--color-panel)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "var(--color-canvas)";
              }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--color-subtle)" }}
            >
              Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details ergänzen…"
              rows={2}
              className="w-full resize-none rounded-2xl px-4 py-3.5 text-[15px] font-medium placeholder:text-[var(--color-subtle)] transition-all focus:outline-none"
              style={{
                background: "var(--color-canvas)",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-brand)";
                e.currentTarget.style.background = "var(--color-panel)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "var(--color-canvas)";
              }}
            />
          </div>

          {/* Due Date */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--color-subtle)" }}
            >
              Fälligkeitsdatum
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-muted)" }}
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-[15px] font-medium transition-all focus:outline-none"
                style={{
                  background: "var(--color-canvas)",
                  border: "1.5px solid var(--color-border)",
                  color: dueDate ? "var(--color-foreground)" : "var(--color-subtle)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-brand)";
                  e.currentTarget.style.background = "var(--color-panel)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.background = "var(--color-canvas)";
                }}
              />
            </div>
          </div>

          {/* Photo toggle button */}
          {!showPhotoSection ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPhotoSection(true)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors"
              style={{
                background: "var(--color-canvas)",
                border: "1.5px dashed var(--color-border)",
                color: "var(--color-muted)",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--color-brand-soft)" }}
              >
                <Camera size={15} style={{ color: "var(--color-brand)" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--color-foreground)" }}>
                  Foto hinzufügen
                </p>
                <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
                  Optional · JPG, PNG bis 10 MB
                </p>
              </div>
              <FileImage size={14} className="ml-auto" style={{ color: "var(--color-subtle)" }} />
            </motion.button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="text-[11px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-subtle)" }}
                  >
                    Foto
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowPhotoSection(false); setPhotoUrl(null); }}
                    className="text-[11px] font-medium"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Entfernen
                  </button>
                </div>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1.5px dashed var(--color-border)" }}
                >
                  <PhotoUpload
                    isDemoMode={isDemoMode}
                    onUploadComplete={(url) => setPhotoUrl(url)}
                    onRemove={() => setPhotoUrl(null)}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 text-[12px] font-medium"
              style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
            >
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="flex-1 rounded-2xl py-3.5 text-[14px] font-semibold transition-colors"
              style={{
                background: "var(--color-canvas)",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-muted)",
              }}
            >
              Abbrechen
            </motion.button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={isSubmitting || !title.trim()}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold text-white disabled:opacity-50"
              style={{
                background: "var(--color-brand)",
                boxShadow: title.trim() ? "var(--shadow-brand)" : "none",
              }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} strokeWidth={2.5} />
              )}
              {isSubmitting ? 'Erstellen…' : 'Aufgabe erstellen'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
