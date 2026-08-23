import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ranclo = localFont({
  src: "./fonts/DhRanclo-Bold.otf",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--font-ranclo",
});

const ghroob = localFont({
  src: [
    { path: "./fonts/GhroobArabicITF-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/GhroobArabicITF-Bold.otf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-ghroob",
});

export const metadata: Metadata = {
  title: { default: "AURENDOR Content OS", template: "%s · AURENDOR Content OS" },
  description: "Owner-controlled social strategy, creative quality, approvals, publishing safety, and learning.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#003F35" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${ranclo.variable} ${ghroob.variable}`} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
