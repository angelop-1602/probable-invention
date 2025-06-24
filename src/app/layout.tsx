import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ProponentAuthProvider } from "@/lib/auth/proponent-auth-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import DataPrefetcher from "@/components/shared/DataPrefetcher";
import { AlertProvider } from "@/components/shared/Alerts";
import { Toaster } from "@/components/ui/sonner";
import CacheManager from "@/components/shared/CacheManager";
import FirebaseProvider from "@/components/providers/firebase-provider";

export const metadata: Metadata = {
  title: "SPUP Ethics Review Committee",
  description: "SPUP Ethics Review Committee Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>
          <FirebaseProvider>
            <AuthProvider>
              <ProponentAuthProvider>
                <CacheManager />
                {/* Prefetch data for faster navigation */}
                <DataPrefetcher />
                <AlertProvider position="bottom-right">
                  {children}
                </AlertProvider>
                <Toaster richColors closeButton />
              </ProponentAuthProvider>
            </AuthProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
