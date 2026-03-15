"use client";

import { Suspense, useState } from "react";
import { signIn } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginContent registered={false} />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const showRegisteredMessage = searchParams.get("registered") === "true";
  return <LoginContent registered={showRegisteredMessage} />;
}

function LoginContent({ registered }: { registered: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasSupabaseConfig) {
      router.push("/dashboard?mode=demo");
      return;
    }

    setIsLoading(true);
    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <AuthLayout
      title="Willkommen zurück"
      subtitle="Melde dich an, um direkt zu deinen Gruppen und Aufgaben zu gelangen."
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <AnimatePresence>
          {registered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <div
                className="mb-6 rounded-[18px] px-4 py-4 text-sm font-medium"
                style={{
                  background: "var(--color-brand-soft)",
                  border: "1px solid var(--color-interactive-border)",
                  color: "var(--color-brand)",
                }}
              >
                Konto erstellt. Du kannst dich jetzt anmelden.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AuthInput
            label="E-Mail"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={hasSupabaseConfig}
            autoComplete="email"
          />
          <AuthInput
            label="Passwort"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={hasSupabaseConfig}
            autoComplete="current-password"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <div
                className="rounded-[18px] px-4 py-4 text-sm font-medium"
                style={{
                  background: "var(--color-danger-soft)",
                  border: "1px solid rgba(220,38,38,0.15)",
                  color: "var(--color-danger)",
                }}
              >
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2">
          <AuthButton isLoading={isLoading} type="submit" className="w-full">
            {hasSupabaseConfig ? "Anmelden" : "Vorschau öffnen"}
          </AuthButton>
        </div>

        <p className="text-center text-[13px]" style={{ color: "var(--color-muted)" }}>
          Noch kein Konto?{" "}
          <Link
            href="/register"
            className="font-bold transition-colors"
            style={{ color: "var(--color-brand)" }}
          >
            Jetzt registrieren
          </Link>
        </p>

        {!hasSupabaseConfig && (
          <div
            className="rounded-[18px] p-5 text-center"
            style={{
              background: "var(--color-interactive-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: "var(--color-subtle)" }}>
              Hinweis: Supabase ist noch nicht verbunden. <br />
              Die App startet im Demo-Modus.
            </p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
