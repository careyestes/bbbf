import type { Metadata, Viewport } from "next";
import { Chicle, Figtree, Fraunces, Modak, Nunito_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { FARM } from "@/lib/config";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
});

const modak = Modak({
  weight: "400",
  variable: "--font-modak",
  subsets: ["latin"],
  display: "swap",
});

const chicle = Chicle({
  weight: "400",
  variable: "--font-chicle",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${FARM.name} · Raw Mississippi Honey`,
    template: `%s · ${FARM.name}`,
  },
  description:
    "Pure raw honey from Big Blue Barn Farm in Shaw, Mississippi. Harvested from our hives, extracted from the comb, and gently strained. Never heated or pasteurized.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigbluebarn.farm",
  ),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable} ${nunitoSans.variable} ${modak.variable} ${chicle.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body>
        <Providers>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
