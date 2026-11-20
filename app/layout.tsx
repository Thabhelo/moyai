import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

// The tight geometric sans used for the homepage and the wordmark, close to the lettering in the hero image.
const tight = Inter_Tight({ variable: "--font-tight", subsets: ["latin"], display: "swap" });


export const metadata: Metadata = {
  metadataBase: new URL("https://moyai.fyi"),
  title: { default: "Moyai", template: "%s · Moyai" },
  description: "Data center accountability for communities that host them.",
  openGraph: {
    title: "Moyai",
    description: "Data center accountability for communities that host them.",
    url: "https://moyai.fyi",
    siteName: "Moyai",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Moyai, by Team Tornadoes. A power pylon in soft green." }],
  },
  twitter: { card: "summary_large_image", title: "Moyai", description: "Data center accountability for communities that host them.", images: ["/og.jpg"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbfbfa" }, { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" }] };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${tight.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
