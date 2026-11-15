import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DESCRIPTION, PRODUCT_NAME, SITE_URL, TAGLINE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const title = `${PRODUCT_NAME}: ${TAGLINE.toLowerCase()}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${title}, free and private`,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: PRODUCT_NAME,
    title,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
