import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";
import { NotificationProvider, NotificationContainer } from "@/components/ui/notification";

export const metadata: Metadata = {
  title: "Executa - Build AI Chatbots from Your Knowledge Base",
  description: "Transform your documents into intelligent AI assistants. Upload knowledge, train custom chatbots, and deploy scalable customer support solutions in minutes.",
  keywords: ["AI chatbot", "knowledge base", "customer support", "artificial intelligence", "automation", "SaaS"],
  authors: [{ name: "Executa Team" }],
  creator: "Executa",
  icons: {
    icon: [
      {
        url: "/Executa-favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/Executa-favicon.png",
    apple: "/Executa-favicon.png",
  },
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
      <body className="font-sans antialiased">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationContainer />
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
