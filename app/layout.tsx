import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CityringAI from "@/app/components/CityringAI";

import Container from "./components/Container";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CityRing",
  description: "Private membership circles",
};

// Enhanced viewport settings for better mobile & notched device support
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Support notched/island devices (iPhone 14+, etc.)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          min-h-screen
          overflow-x-hidden
        `}
      >
        <AuthProvider>
          <Container>
            <Navbar />
            {children}
          </Container>
        </AuthProvider>
        <CityringAI />
      </body>
    </html>
  );
}