import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AralTayo — AI Study Platform for Filipino Students",
  description:
    "AralTayo is a free AI-powered study platform for Philippine K-12 and college students. Generate quizzes, reviewers, flashcards, and get topic explanations.",
  keywords: ["Philippines", "study", "AI", "K-12", "reviewer", "flashcards", "quiz"],
  manifest: "/manifest.json",
  themeColor: "#F59E0B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AralTayo",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fil" className={`${inter.variable} ${fraunces.variable} dark h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
