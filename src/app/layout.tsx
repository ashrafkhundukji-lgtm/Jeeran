import type { Metadata } from "next";
import { baloo2, inter, notoKufiArabic } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jeeran Network",
  description: "Host a QR stand for nearby shops, earn ad credits, and get your own offers seen at their counters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baloo2.variable} ${notoKufiArabic.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
