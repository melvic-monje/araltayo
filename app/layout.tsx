import type { Metadata, Viewport } from "next";
import { Inter, Rampart_One } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-body" });
const rampart = Rampart_One({ subsets: ["latin"], weight: ["400"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Bardagulan 2026",
  description: "Let's get ready to BARDUGS! Multiplayer 3D race with stuns and harpoons.",
};

export const viewport: Viewport = {
  themeColor: "#0B0E1A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${rampart.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
