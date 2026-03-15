"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AuthButtonProps extends Omit<ComponentPropsWithoutRef<typeof Button>, "size"> {
  isLoading?: boolean;
}

export default function AuthButton({
  children,
  isLoading,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <Button className={className} size="lg" disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </Button>
  );
}
