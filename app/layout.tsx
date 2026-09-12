import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeaseKeeper | Lease-aware commercial property management",
  description: "Manage rent, maintenance, vendors, compliance, and property financials in one lease-aware commercial property platform.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
