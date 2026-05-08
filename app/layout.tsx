import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/landing/Footer";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "PeerHelp",
  description: "PeerHelp - Campus Resource Exchange",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    {
      path: "../public/font/NeueHaasDisplay-XThin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/font/NeueHaasDisplay-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/font/NeueHaasDisplay-Roman.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/NeueHaasDisplay-Mediu.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/font/NeueHaasDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${display.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
