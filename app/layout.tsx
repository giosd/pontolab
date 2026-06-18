import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/AppProviders";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { themeInitScript } from "@/lib/theme";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "PontoLab",
  title: {
    default: "PontoLab",
    template: "%s · PontoLab",
  },
  description:
    "Sistema de gestão de apontamentos, horas e produtividade.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PontoLab",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#38a8d8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b3a4d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
