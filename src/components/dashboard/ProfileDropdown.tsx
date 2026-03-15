'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Settings } from 'lucide-react';
import { signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  secondaryName?: string | null;
  avatarName: string;
  avatarUrl?: string | null;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  displayName,
  secondaryName,
  avatarName,
  avatarUrl,
}) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-black/5"
          >
            <div className="mb-1 border-b border-[var(--color-border)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-subtle)]">Konto</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar
                  name={avatarName}
                  size="sm"
                  src={avatarUrl}
                  className="h-11 w-11 border-2 border-white shadow-soft"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{displayName}</p>
                  {secondaryName ? (
                    <p className="truncate text-xs text-[var(--color-muted)]">@{secondaryName}</p>
                  ) : null}
                </div>
              </div>
            </div>
            
            <div className="space-y-0.5">
              <button 
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-foreground)]"
                onClick={() => {
                  onClose();
                  // No profile page yet, just close
                }}
              >
                <User size={18} />
                Profil
              </button>
              <button 
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-foreground)]"
                onClick={onClose}
              >
                <Settings size={18} />
                Einstellungen
              </button>
            </div>

            <div className="mt-1 pt-1 border-t border-[var(--color-border)]">
              <button 
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] font-bold text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut size={18} />
                Abmelden
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
