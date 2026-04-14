import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doc-to-6Ws",
  description: "Capture document images, extract 6W statements, and file them into Google Drive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
