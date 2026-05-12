import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "RagaAI Clinical Ops — Manual Team Tracker",
  description: "Healthcare agents clinical operations performance dashboard for manual team tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
