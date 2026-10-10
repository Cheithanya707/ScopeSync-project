import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter, JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { NoDragDrop } from "@/components/layout/NoDragDrop";
import { StartupExperience } from "@/components/layout/StartupExperience";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const brandFont = Plus_Jakarta_Sans({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["800"],
});

const brandFallbackFont = Outfit({
  variable: "--font-brand-fallback",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scopesync.app"),
  title: {
    default: "ScopeSync",
    template: "%s | ScopeSync",
  },
  description: "Requirements, scope changes and delivery in one traceable workspace.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "ScopeSync",
    description: "Requirements, scope changes and delivery in one traceable workspace.",
    type: "website",
    siteName: "ScopeSync",
    url: "https://scopesync.app",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ScopeSync — Requirements, scope changes and delivery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeSync",
    description: "Requirements, scope changes and delivery in one traceable workspace.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${brandFont.variable} ${brandFallbackFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ThemeProvider>
            <NoDragDrop>
              <WorkspaceProvider>
                <StartupExperience>{children}</StartupExperience>
              </WorkspaceProvider>
            </NoDragDrop>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
