import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fontJetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobFlow",
  description: "A personal, AI-assisted job application tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontInter.variable} ${fontJetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        {children}
        {/* Toasts — bottom-right stack (CONTEXT/02 §12). Dark-first. */}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
