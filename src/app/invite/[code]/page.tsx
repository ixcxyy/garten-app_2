'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function InvitePage() {
  const { code } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'joining' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      handleInvite();
    }
  }, [code]);

  const handleInvite = async () => {
    try {
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        // Redirect to login with return path
        router.push(`/login?next=/invite/${code}`);
        return;
      }

      // 2. Verify invite code and get group info
      setStatus('verifying');
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', code)
        .single();

      if (groupError || !group) {
        setStatus('error');
        setError('Invalid or expired invite code.');
        return;
      }

      setGroupName(group.name);
      setGroupId(group.id);

      // 3. Join group
      setStatus('joining');
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member' // Default role
        });

      // Handle duplicate join (already a member) - code 23505 is unique violation in postgres
      if (joinError && (joinError as any).code !== '23505') {
        throw joinError;
      }

      setStatus('success');
      
      // Auto redirect after delay
      setTimeout(() => {
        router.push(`/group/${group.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('Invite error:', err);
      setStatus('error');
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-400 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-400 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-col items-center text-center">
          {status === 'verifying' || status === 'joining' ? (
            <>
              <div className="mb-6 rounded-full bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {status === 'verifying' ? 'Verifying Invite...' : 'Joining Group...'}
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Please wait a moment while we process your invitation.
              </p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="mb-6 rounded-full bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Welcome to {groupName}!
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                You've successfully joined the group. Redirecting you now...
              </p>
              <button 
                onClick={() => router.push(`/group/${groupId}`)}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Go to Group <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <div className="mb-6 rounded-full bg-red-50 p-4 dark:bg-red-500/10">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Invite Failed
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {error || 'This invite link is no longer valid.'}
              </p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 font-semibold text-zinc-900 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-800"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
