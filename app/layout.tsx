import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERM Agent - Enterprise Risk Management",
  description: "AI-powered Enterprise Risk Management application with autonomous agent capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
