"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthInput({ label, error, ...props }: AuthInputProps) {
  return <Input label={label} hint={error} aria-invalid={Boolean(error)} {...props} />;
}
