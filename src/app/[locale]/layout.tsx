import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { SlantRounder } from "@/components/ui/slant-rounder";
import { routing } from "@/i18n/routing";

// One family for the whole site (design/handoff/README.md, "Typografie").
// Self-hosted variable font (OFL, @fontsource-variable/outfit): no request to Google.
const outfit = localFont({
  src: [
    {
      path: "../../../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-outfit",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Address bar colour on mobile: the header green (RP-80).
export const viewport: Viewport = { themeColor: "#033A19" };

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    // Absolute URLs for the share image and icons.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://racketpicker.com"),
    title: t("title"),
    description: t("description"),
    openGraph: {
      siteName: "Racketpicker",
      locale: locale === "nl" ? "nl_NL" : "es_ES",
      type: "website",
    },
    // Not indexable until launch; SEO setup follows in RP-34.
    robots: { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          {/* First in the tab order, so the choice is reachable before the page. */}
          <CookieBanner />
          {children}
          <Footer />
          <GoogleAnalytics />
        </NextIntlClientProvider>
        <SlantRounder />
      </body>
    </html>
  );
}
