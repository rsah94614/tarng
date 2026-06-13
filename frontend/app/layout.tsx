import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "tarng",
    template: "%s | tarng",
  },
  description: "A modern social media platform — share your world with tarng.",
  keywords: ["social media", "tarng", "posts", "feed"],
  authors: [{ name: "tarng" }],
  openGraph: {
    title: "tarng",
    description: "A modern social media platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
