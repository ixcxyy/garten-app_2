'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PhotoUpload } from './PhotoUpload';

interface CreateTodoModalProps {
  groupId: string;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ groupId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
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
            creator_name: userData.user?.user_metadata?.username || userData.user?.email?.split('@')[0] || 'Unknown',
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
        <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create New Task</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X size={20} />
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
                delayChildren: 0.2
              }
            }
          }}
          onSubmit={handleSubmit} 
          className="p-8"
        >
          <div className="space-y-6">
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-emerald-500"
                required
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-emerald-500"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Photo (Optional)
              </label>
              <PhotoUpload 
                onUploadComplete={(url) => setPhotoUrl(url)}
                onRemove={() => setPhotoUrl(null)}
              />
            </motion.div>
          </div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="mt-8 flex gap-3"
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[1.25rem] border border-zinc-200 px-4 py-4 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-[2] flex items-center justify-center gap-2 rounded-[1.25rem] bg-emerald-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};
