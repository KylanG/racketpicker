import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Racketpicker",
  description: "Vergelijk padelrackets, schoenen en gear bij Nederlandse winkels.",
  // Not indexable until launch; SEO setup follows in RP-34.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Locale-aware <html lang> moves to the [locale] layout in RP-11.
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
