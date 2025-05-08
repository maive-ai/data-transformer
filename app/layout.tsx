import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maive",
  description: "Created with v0",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-oid="8ek2-qf">
      <body data-oid="dmg612i">{children}</body>
    </html>
  );
}
