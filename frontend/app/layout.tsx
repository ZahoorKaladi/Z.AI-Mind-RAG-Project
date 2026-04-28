import type { Metadata } from "next";
// 1. Import 'Outfit' alongside your existing fonts
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Configure the new premium header font
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaladiMind | Built by Zahoor Ahmed Kaladi",
  description: "Enterprise Document Intelligence Engine. Instantly extract insights from research papers, contracts, and study materials using local AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // 3. Inject the outfit.variable into the HTML class list
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
    >
      <body className="font-sans min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}