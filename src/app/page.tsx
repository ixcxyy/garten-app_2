"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

const isDemoEnv =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isDemoEnv) {
      router.replace("/dashboard");
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

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
