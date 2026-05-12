import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "RagaAI Clinical Ops v2.1 — Dynamic Dashboard",
  description: "Dynamic performance dashboard for clinical operations team members",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
