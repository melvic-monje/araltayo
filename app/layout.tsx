import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const gameria = localFont({
  src: "./fonts/GAMERIA.ttf",
  variable: "--font-display",
  display: "swap",
});
const shifaRame = localFont({
  src: "./fonts/Shifa-Rame.ttf",
  variable: "--font-body",
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
    <html lang="en" className={`${shifaRame.variable} ${gameria.variable}`}>
      <body className={shifaRame.className}>{children}</body>
    </html>
  );
}
