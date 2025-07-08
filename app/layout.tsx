import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maive",
  description: "AI-powered data transformation platform",
  generator: "Maive",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-oid="8ek2-qf">
      <body className="font-sans antialiased" data-oid="dmg612i">
        {children}
      </body>
    </html>
  );
}
