import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

// 🔥 1. IMPORT AUTH PROVIDER
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Curocity: The CPR Ecosystem",
  description: "A full-stack, multi-tenant web application...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        {/* 🔥 2. WRAP EVERYTHING INSIDE AUTH PROVIDER */}
        <AuthProvider>
            <Providers>
              {children}
            </Providers>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}