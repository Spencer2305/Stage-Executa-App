import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Executa - Build AI Chatbots from Your Knowledge Base",
  description: "Transform your documents into intelligent AI assistants. Upload knowledge, train custom chatbots, and deploy scalable customer support solutions in minutes.",
  keywords: ["AI chatbot", "knowledge base", "customer support", "artificial intelligence", "automation", "SaaS"],
  authors: [{ name: "Executa Team" }],
  creator: "Executa",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://executa.ai",
    siteName: "Executa",
    title: "Executa - Build AI Chatbots from Your Knowledge Base",
    description: "Transform your documents into intelligent AI assistants. Upload knowledge, train custom chatbots, and deploy scalable customer support solutions in minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Executa - Build AI Chatbots from Your Knowledge Base",
    description: "Transform your documents into intelligent AI assistants. Upload knowledge, train custom chatbots, and deploy scalable customer support solutions in minutes.",
    creator: "@executa_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
