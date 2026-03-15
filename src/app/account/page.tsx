"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Camera,
  LogOut,
  Trash2,
  Save,
  Smartphone,
  X,
  Share,
  PlusSquare,
  MoreVertical,
  Chrome,
  Sun,
  Moon,
} from "lucide-react";
import { supabase, signOut } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";
import { Avatar } from "@/components/ui";
import { useTheme } from "@/lib/theme";

const isDemoEnv =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export default function AccountPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoEnv) {
        const demo: UserProfile = {
          id: "demo",
          username: "Gärtner.Pro",
          first_name: "Demo",
          last_name: "User",
          avatar_url: null,
          created_at: new Date().toISOString(),
        };
        setProfile(demo);
        setFirstName(demo.first_name ?? "");
        setLastName(demo.last_name ?? "");
        setUsername(demo.username);
        setAvatarUrl(demo.avatar_url);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setUsername(data.username ?? "");
        setAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!profile || isDemoEnv) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: profile.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          username: username.trim(),
          avatar_url: avatarUrl,
        });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Speichern fehlgeschlagen";
      setSaveError(msg);
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || isDemoEnv) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Immediately persist the new avatar_url to the profile
      await supabase
        .from("user_profiles")
        .upsert({ id: profile.id, avatar_url: publicUrl });

      setAvatarUrl(publicUrl);
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setSaveError("Bild konnte nicht hochgeladen werden.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile || isDemoEnv) return;
    setDeleting(true);
    try {
      // Delete profile (cascade should handle group memberships)
      await supabase.from("user_profiles").delete().eq("id", profile.id);
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Error deleting account:", err);
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const hasChanges =
    firstName !== (profile?.first_name ?? "") ||
    lastName !== (profile?.last_name ?? "") ||
    username !== (profile?.username ?? "") ||
    avatarUrl !== profile?.avatar_url;

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-canvas)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        >
          <Leaf size={22} style={{ color: "var(--color-brand)" }} strokeWidth={1.5} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-36" style={{ background: "var(--color-canvas)", color: "var(--color-foreground)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5"
        style={{
          background: "var(--color-header-bg)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-white"
            style={{ background: "var(--color-brand)" }}
          >
            <Leaf size={13} strokeWidth={2} />
          </div>
          <span
            className="text-[15px] tracking-tight"
            style={{
              color: "var(--color-foreground)",
              fontFamily: "var(--font-instrument-serif)",
              letterSpacing: "-0.01em",
            }}
          >
            Konto
          </span>
        </motion.div>
      </header>

      <main className="px-5 overflow-x-hidden">
        {/* Profile Section */}
        <motion.div
          className="pt-8 pb-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profilbild"
                  className="h-24 w-24 rounded-full object-cover"
                  style={{ border: "3px solid var(--color-brand-soft)" }}
                />
              ) : (
                <Avatar
                  name={`${firstName} ${lastName}`.trim() || username || "G"}
                  className="h-24 w-24 text-2xl"
                />
              )}
              <label
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white"
                style={{ background: "var(--color-brand)", boxShadow: "var(--shadow-soft)" }}
              >
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-2"
                style={{ color: "var(--color-subtle)" }}
              >
                Vorname
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Vorname"
                className="w-full rounded-[16px] px-4 py-3 text-[15px] focus:outline-none transition-shadow"
                style={{
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-2"
                style={{ color: "var(--color-subtle)" }}
              >
                Nachname
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nachname"
                className="w-full rounded-[16px] px-4 py-3 text-[15px] focus:outline-none transition-shadow"
                style={{
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-2"
                style={{ color: "var(--color-subtle)" }}
              >
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Benutzername"
                className="w-full rounded-[16px] px-4 py-3 text-[15px] focus:outline-none transition-shadow"
                style={{
                  background: "var(--color-panel)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>
          </div>

          {/* Save Error */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-[14px] px-4 py-3 text-[13px] font-medium"
                style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)", border: "1px solid rgba(220,38,38,0.15)" }}
              >
                {saveError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save Button */}
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 text-[15px] font-semibold text-white"
                style={{
                  background: "var(--color-brand)",
                  boxShadow: "0 4px 24px rgba(45,97,71,0.3)",
                }}
              >
                <Save size={16} />
                {saving ? "Speichern…" : saved ? "Gespeichert!" : "Änderungen speichern"}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Divider */}
        <div className="h-px my-2" style={{ background: "var(--color-border)" }} />

        {/* Actions */}
        <div className="py-4 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3.5 text-left transition-colors"
            style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--color-foreground)" }}>
                {theme === "dark" ? "Light Mode aktivieren" : "Dark Mode aktivieren"}
              </p>
              <p className="text-[12px]" style={{ color: "var(--color-muted)" }}>
                Aktuell: {theme === "dark" ? "Dunkles Design" : "Helles Design"}
              </p>
            </div>
          </button>

          {/* PWA Install Tutorial */}
          <button
            onClick={() => setShowTutorial(true)}
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3.5 text-left transition-colors"
            style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              <Smartphone size={16} />
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--color-foreground)" }}>
                App installieren
              </p>
              <p className="text-[12px]" style={{ color: "var(--color-muted)" }}>
                Zum Homebildschirm hinzufügen
              </p>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3.5 text-left transition-colors"
            style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--color-interactive-bg)", color: "var(--color-muted)" }}
            >
              <LogOut size={16} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--color-foreground)" }}>
              Abmelden
            </p>
          </button>

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3.5 text-left transition-colors"
            style={{ background: "rgba(176,58,58,0.06)", border: "1px solid rgba(176,58,58,0.12)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(176,58,58,0.1)", color: "var(--color-danger)" }}
            >
              <Trash2 size={16} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--color-danger)" }}>
              Konto löschen
            </p>
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 bottom-32 z-50 rounded-[24px] p-6"
              style={{
                background: "var(--color-panel)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-modal)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--color-foreground)" }}
              >
                Konto wirklich löschen?
              </h3>
              <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--color-muted)" }}>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten, Gruppen und
                Aufgaben werden dauerhaft gelöscht.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-[14px] py-3 text-[14px] font-semibold"
                  style={{
                    background: "var(--color-canvas-alt)",
                    color: "var(--color-foreground)",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 rounded-[14px] py-3 text-[14px] font-semibold text-white"
                  style={{ background: "var(--color-danger)" }}
                >
                  {deleting ? "Löschen…" : "Endgültig löschen"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PWA Install Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && <PwaTutorialModal onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
    </div>
  );
}

function PwaTutorialModal({ onClose }: { onClose: () => void }) {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    }
  }, []);

  const iosSteps = [
    {
      icon: Share,
      title: "Teilen-Button antippen",
      desc: "Öffne Safari und tippe unten auf das Teilen-Symbol (Quadrat mit Pfeil nach oben).",
    },
    {
      icon: PlusSquare,
      title: "\"Zum Home-Bildschirm\" wählen",
      desc: "Scrolle in der Liste nach unten und tippe auf \"Zum Home-Bildschirm\".",
    },
    {
      icon: Smartphone,
      title: "Hinzufügen bestätigen",
      desc: "Tippe oben rechts auf \"Hinzufügen\". Die App erscheint jetzt auf deinem Home-Bildschirm.",
    },
  ];

  const androidSteps = [
    {
      icon: MoreVertical,
      title: "Menü öffnen",
      desc: "Öffne Chrome und tippe oben rechts auf die drei Punkte (⋮).",
    },
    {
      icon: PlusSquare,
      title: "\"App installieren\" oder \"Zum Startbildschirm\"",
      desc: "Wähle im Menü \"App installieren\" oder \"Zum Startbildschirm hinzufügen\".",
    },
    {
      icon: Smartphone,
      title: "Installieren bestätigen",
      desc: "Tippe auf \"Installieren\". Die App erscheint als Icon auf deinem Startbildschirm.",
    },
  ];

  const steps = platform === "ios" ? iosSteps : androidSteps;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] px-5 pt-6"
        style={{
          maxHeight: '90dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))',
          background: "var(--color-panel)",
          boxShadow: "var(--shadow-modal)",
        } as React.CSSProperties}
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: "var(--color-border)" }} />

        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-instrument-serif)" }}
          >
            App installieren
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--color-canvas-alt)", color: "var(--color-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Platform toggle (if not auto-detected) */}
        {!platform && (
          <div className="mb-6">
            <p className="text-[13px] mb-3" style={{ color: "var(--color-muted)" }}>
              Welches Gerät nutzt du?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPlatform("ios")}
                className="flex-1 flex items-center justify-center gap-2 rounded-[16px] py-3 text-[14px] font-semibold"
                style={{ background: "var(--color-canvas-alt)", color: "var(--color-foreground)" }}
              >
                <Smartphone size={16} />
                iPhone / iPad
              </button>
              <button
                onClick={() => setPlatform("android")}
                className="flex-1 flex items-center justify-center gap-2 rounded-[16px] py-3 text-[14px] font-semibold"
                style={{ background: "var(--color-canvas-alt)", color: "var(--color-foreground)" }}
              >
                <Chrome size={16} />
                Android
              </button>
            </div>
          </div>
        )}

        {/* Platform label */}
        {platform && (
          <div className="flex items-center gap-2 mb-5">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              {platform === "ios" ? "iPhone / iPad" : "Android"}
            </span>
            <button
              onClick={() => setPlatform(platform === "ios" ? "android" : "ios")}
              className="text-[12px] font-medium underline"
              style={{ color: "var(--color-muted)" }}
            >
              {platform === "ios" ? "Android?" : "iPhone?"}
            </button>
          </div>
        )}

        {/* Steps */}
        {platform && (
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex gap-4 rounded-[20px] p-4"
                  style={{
                    background: "var(--color-canvas-alt)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "var(--color-brand)" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p
                      className="text-[14px] font-semibold mb-1"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
