import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moyai",
  description: "Verified grid relief for the communities that host AI data centers.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// System fonts only: nothing to download, so text paints at once.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
