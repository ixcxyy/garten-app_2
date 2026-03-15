import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/navigation/MobileNav";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Garden Groups",
  description: "A calm, collaborative garden organizer with an Apple-meets-Notion design system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${ibmPlexMono.variable} min-h-screen antialiased`}>
        <main className="min-h-screen pb-24 sm:pb-0">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
