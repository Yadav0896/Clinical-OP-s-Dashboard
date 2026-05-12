import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maya AI Features — PA Intelligence Engine",
  description: "AI-powered prior authorization tools: ICD-10 validation, document recommendations, gap checking, and appeal letter generation.",
};

export default function AIFeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
