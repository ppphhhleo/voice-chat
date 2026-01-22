import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Grok Voice Chat",
  description: "Real-time voice chat with personality customization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-[var(--surface)] text-[var(--on-surface)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
