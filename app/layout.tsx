import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenScript | Edit Video Like a Word Doc",
  description: "The open-source alternative to Descript. Edit video by editing text. Local-first, privacy-focused video editing powered by AI.",
  openGraph: {
    title: "OpenScript | Edit Video Like a Word Doc",
    description: "The open-source alternative to Descript. Edit video by editing text. Local-first, privacy-focused video editing.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
