import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AABW Smart Deadline Tracker",
  description:
    "AI-powered deadline tracking and reminder bot for Agentic AI Build Week 2026 — Jul 8–12, Ho Chi Minh City",
  keywords: ["AABW", "hackathon", "deadline tracker", "AI", "Build Week 2026"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans bg-white text-gray-900 antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
