import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swim Check HK",
  description: "LCSD swimming pool availability for Hong Kong.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Swim Check HK",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-HK">
      <body>{children}</body>
    </html>
  );
}
