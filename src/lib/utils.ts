import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserProfile } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ProfileIdentity = Pick<UserProfile, "username" | "first_name" | "last_name"> | null | undefined;

export function getProfileDisplayName(profile: ProfileIdentity) {
  const fullName = [profile?.first_name, profile?.last_name]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  return fullName || profile?.username?.trim() || "";
}

export function getProfileGreetingName(profile: ProfileIdentity) {
  return profile?.first_name?.trim() || profile?.username?.trim() || "";
}

export function getProfileSecondaryName(profile: ProfileIdentity) {
  const username = profile?.username?.trim();
  const fullName = getProfileDisplayName(profile);

  if (!username || username === fullName) {
    return null;
  }

  return username;
}
