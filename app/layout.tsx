import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-body" });
const gameria = localFont({
  src: "./fonts/GAMERIA.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bardagulan 2026",
  description: "Let's get ready to BARDUGS! Multiplayer 3D race with stuns and harpoons.",
};

export const viewport: Viewport = {
  themeColor: "#0B0E1A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${gameria.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
