import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HorizonMonkey — Semantic Chaos Engineering for Long-Horizon Agents",
  description:
    "Inject plausible semantic faults into a long-running agent's observations, memory and objective, then measure how far the resulting belief travels.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
