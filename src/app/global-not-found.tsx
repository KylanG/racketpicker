import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// Rendered for any URL that matches no route. Dutch, as /nl/ is the default market.
// Localized 404s for missing products are handled by [locale]/not-found.tsx.
export const metadata: Metadata = {
  title: "Pagina niet gevonden – Racketpicker",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-3xl font-black italic">Pagina niet gevonden</h1>
          <Link href="/nl" className="underline underline-offset-4">
            Terug naar de homepagina
          </Link>
        </main>
      </body>
    </html>
  );
}
