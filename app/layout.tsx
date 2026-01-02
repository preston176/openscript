import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Local Video Editor | Edit Video Like a Word Doc",
  description: "The open-source, local-first alternative to Descript. Edit video by editing text. No cloud uploads, no monthly fees. Powered by local AI.",
  openGraph: {
    title: "Local Video Editor | Edit Video Like a Word Doc",
    description: "The open-source, local-first alternative to Descript. Edit video by editing text. No cloud uploads, no monthly fees.",
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
