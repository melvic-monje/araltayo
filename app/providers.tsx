"use client";

import { ThemeProvider } from "@/lib/theme";
import OfflineBanner from "@/components/OfflineBanner";
import InstallPrompt from "@/components/InstallPrompt";
import PushOptIn from "@/components/PushOptIn";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <OfflineBanner />
      <InstallPrompt />
      <PushOptIn />
    </ThemeProvider>
  );
}
