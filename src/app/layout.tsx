import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/navigation/MobileNav";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Garden Groups",
  description: "Gemeinsam gärtnern – organisiert und entspannt.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Garden Groups",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d6147",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${dmSans.variable} ${instrumentSerif.variable} min-h-screen antialiased`}>
        <main className="min-h-screen pb-24 sm:pb-0">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
