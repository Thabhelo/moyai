import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// One rounded typeface, stored with the site so nothing loads from another server.
const round = Nunito({ variable: "--font-round", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Moyai",
  description: "Verified grid relief for the communities that host AI data centers.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${round.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
