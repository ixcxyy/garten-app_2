'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Poll, PollOption } from '@/lib/types';

interface PollCardProps {
  poll: Poll;
  currentUserId?: string;
  onDeleted?: () => void;
  isDemoMode?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, currentUserId, onDeleted, isDemoMode }) => {
  const [options, setOptions] = useState<(PollOption & { vote_count: number })[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const isCreator = poll.created_by === currentUserId;

  useEffect(() => {
    const fetchPollData = async () => {
      if (isDemoMode) {
        setOptions([
          { id: 'd1', poll_id: poll.id, label: 'Option A', created_at: '', vote_count: 3 },
          { id: 'd2', poll_id: poll.id, label: 'Option B', created_at: '', vote_count: 1 },
        ]);
        setLoading(false);
        return;
      }

      const [{ data: opts }, { data: votes }] = await Promise.all([
        supabase.from('poll_options').select('*').eq('poll_id', poll.id),
        supabase.from('poll_votes').select('option_id, user_id').eq('poll_id', poll.id),
      ]);

      const voteCounts: Record<string, number> = {};
      let userVote: string | null = null;
      (votes ?? []).forEach(v => {
        voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1;
        if (v.user_id === currentUserId) userVote = v.option_id;
      });

      setOptions((opts ?? []).map(o => ({ ...o, vote_count: voteCounts[o.id] ?? 0 })));
      setMyVote(userVote);
      setLoading(false);
    };

    void fetchPollData();
  }, [poll.id, currentUserId, isDemoMode]);

  const totalVotes = options.reduce((s, o) => s + o.vote_count, 0);

  const handleVote = async (optionId: string) => {
    if (isDemoMode || voting) return;
    setVoting(true);

    try {
      // Remove existing vote
      if (myVote) {
        await supabase.from('poll_votes').delete().eq('poll_id', poll.id).eq('user_id', currentUserId!);
        setOptions(prev => prev.map(o => o.id === myVote ? { ...o, vote_count: o.vote_count - 1 } : o));
      }

      // If clicking the same option, just remove vote
      if (myVote === optionId) {
        setMyVote(null);
        setVoting(false);
        return;
      }

      await supabase.from('poll_votes').insert({ poll_id: poll.id, option_id: optionId, user_id: currentUserId! });
      setOptions(prev => prev.map(o => o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o));
      setMyVote(optionId);
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (isDemoMode) return;
    try {
      await supabase.from('polls').delete().eq('id', poll.id);
      onDeleted?.();
    } catch (err) {
      console.error('Delete poll error:', err);
    }
  };

  if (loading) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="overflow-hidden rounded-[20px]"
      style={{
        background: "var(--color-panel)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--color-brand-soft)" }}
            >
              <BarChart3 size={14} style={{ color: "var(--color-brand)" }} />
            </div>
            <p className="text-[15px] font-semibold leading-snug" style={{ color: "var(--color-foreground)" }}>
              {poll.question}
            </p>
          </div>
          {isCreator && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleDelete}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ color: "var(--color-danger)", background: "var(--color-danger-soft)" }}
            >
              <Trash2 size={12} />
            </motion.button>
          )}
        </div>

        <p className="mt-1 text-[11px] font-medium" style={{ color: "var(--color-subtle)" }}>
          {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'}
        </p>
      </div>

      <div className="px-4 pb-4 space-y-1.5">
        {options.map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          const isSelected = myVote === opt.id;

          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVote(opt.id)}
              disabled={voting}
              className="relative w-full overflow-hidden rounded-xl py-3 px-3.5 text-left transition-all"
              style={{
                background: isSelected ? "var(--color-brand-soft)" : "var(--color-canvas)",
                border: isSelected ? "1.5px solid var(--color-brand)" : "1.5px solid var(--color-border)",
              }}
            >
              {/* Progress bar background */}
              {totalVotes > 0 && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-xl"
                  style={{
                    background: isSelected ? "var(--color-brand)" : "var(--color-border)",
                    opacity: isSelected ? 0.15 : 0.3,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              )}

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: "var(--color-brand)" }}
                    >
                      <Check size={10} color="white" strokeWidth={3} />
                    </div>
                  )}
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: isSelected ? "var(--color-brand)" : "var(--color-foreground)" }}
                  >
                    {opt.label}
                  </span>
                </div>
                {totalVotes > 0 && (
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--color-subtle)" }}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
