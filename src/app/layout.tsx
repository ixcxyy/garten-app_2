import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/navigation/MobileNav";
import { ThemeProvider } from "@/lib/theme";
import { GlobalNotifications } from "@/components/navigation/GlobalNotifications";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Garden Groups",
  description: "Gemeinsam gärtnern – organisiert und entspannt.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Garden Groups",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
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
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className={`${manrope.variable} min-h-screen antialiased`}>
        <ThemeProvider>
          <GlobalNotifications />
          <main className="min-h-screen pb-24 sm:pb-0">{children}</main>
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
