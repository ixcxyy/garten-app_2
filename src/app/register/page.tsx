"use client";

import { useState } from "react";
import { signUp } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

  const getRandomColor = () => {
    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const initials = getInitials(formData.firstName, formData.lastName);
    const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=256`;

    const { error: signUpError } = await signUp(formData.email, formData.password, {
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
      title="Create Account" 
      subtitle="Join us and start your journey today"
    >
      <form onSubmit={handleRegister}>
        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            label="First Name"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <AuthInput
            label="Last Name"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <AuthInput
          label="Username"
          name="username"
          placeholder="johndoe123"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AuthButton isLoading={isLoading} type="submit">
          Initialize Account
        </AuthButton>

        <p className="mt-8 text-center text-white/40 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
