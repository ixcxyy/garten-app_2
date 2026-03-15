"use client";

import { useState } from "react";
import { signUp, supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasSupabaseConfig) {
      router.push("/dashboard?mode=demo");
      return;
    }

    setIsLoading(true);
    const initials = getInitials(formData.firstName, formData.lastName);
    const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=256`;

    const { data: signUpData, error: signUpError } = await signUp(formData.email, formData.password, {
      data: {
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        avatar_url: avatarUrl,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else {
      // Manually create profile if trigger is not set up
      if (signUpData?.user) {
        await supabase
          .from("user_profiles")
          .insert([
            {
              id: signUpData.user.id,
              username: formData.username,
              first_name: formData.firstName,
              last_name: formData.lastName,
              avatar_url: avatarUrl,
            },
          ]);
      }
      router.push("/login?registered=true");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <AuthLayout
      title="Konto erstellen"
      subtitle="Bringe Ordnung in euren Gartenalltag mit einer klaren Übersicht für alle."
    >
      <form onSubmit={handleRegister} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            label="Vorname"
            name="firstName"
            placeholder="Jonas"
            value={formData.firstName}
            onChange={handleChange}
            required={hasSupabaseConfig}
          />
          <AuthInput
            label="Nachname"
            name="lastName"
            placeholder="Mayer"
            value={formData.lastName}
            onChange={handleChange}
            required={hasSupabaseConfig}
          />
        </div>

        <AuthInput
          label="Benutzername"
          name="username"
          placeholder="garten.jonas"
          value={formData.username}
          onChange={handleChange}
          required={hasSupabaseConfig}
        />

        <AuthInput
          label="E-Mail"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          required={hasSupabaseConfig}
        />

        <AuthInput
          label="Passwort"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required={hasSupabaseConfig}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <div className="rounded-[18px] border border-red-500/10 bg-red-500/5 px-4 py-4 text-sm font-medium text-red-600">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2">
          <AuthButton isLoading={isLoading} type="submit" className="w-full">
            {hasSupabaseConfig ? "Konto anlegen" : "Vorschau öffnen"}
          </AuthButton>
        </div>

        <p className="text-center text-[13px] text-[var(--color-muted)]">
          Hast du schon ein Konto?{" "}
          <Link
            href="/login"
            className="font-bold text-[var(--color-brand)] transition-colors hover:text-[var(--color-brand-strong)]"
          >
            Jetzt anmelden
          </Link>
        </p>

        {!hasSupabaseConfig && (
          <div className="rounded-[22px] bg-[var(--color-canvas)] p-5 text-center">
            <p className="text-[12px] font-medium leading-relaxed text-[var(--color-subtle)]">
              Hinweis: Supabase ist noch nicht verbunden. <br />
              Die App startet im Demo-Modus.
            </p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
