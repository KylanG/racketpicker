import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { showSampleData } from "@/lib/catalog/sample-data";
import type { SlantSize } from "@/lib/ui/slant";
import { ComponentsDemo } from "./components-demo";

/*
 * Internal styleguide for checking design tokens on Preview deployments.
 * Only available where sample data is enabled (Preview/Development), never in Production.
 * Developer-facing page: copy is intentionally not translated.
 */

export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

const COLORS: [string, string, string][] = [
  ["green-1000", "#02301A", "bg-green-1000"],
  ["green-950", "#033A19", "bg-green-950"],
  ["green-900", "#04471F", "bg-green-900"],
  ["green-800", "#05561F", "bg-green-800"],
  ["green-700", "#07602A", "bg-green-700"],
  ["lime", "#C8E63A", "bg-lime"],
  ["lime-hover", "#D8F25A", "bg-lime-hover"],
  ["lime-soft", "#D2EC4E", "bg-lime-soft"],
  ["ink", "#0B2A17", "bg-ink"],
  ["ink-2", "#23402E", "bg-ink-2"],
  ["muted", "#3C5A47", "bg-muted"],
  ["muted-2", "#56695C", "bg-muted-2"],
  ["border-strong", "#8FA595", "bg-border-strong"],
  ["border", "#DCE6D6", "bg-border"],
  ["line", "#E3EBDD", "bg-line"],
  ["surface", "#F3F7EE", "bg-surface"],
  ["surface-2", "#F4F7F0", "bg-surface-2"],
  ["surface-hover", "#E6EFDA", "bg-surface-hover"],
  ["warn", "#8A4B1F", "bg-warn"],
];

const SLANTS: SlantSize[] = [5, 8, 10, 12, 14, 32];

const Arrow = () => (
  <svg data-arrow width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 11 11 3M5 3h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export default function StyleguidePage() {
  if (!showSampleData()) notFound();

  return (
    <main className="rp-container flex flex-col gap-16 py-16">
      <header>
        <p className="rp-eyebrow">Intern · RP-20 / RP-21</p>
        <h1 className="rp-h1 mt-2">Styleguide</h1>
        <p className="text-muted mt-3 max-w-[var(--container-read)]">
          Tokens uit de design-handover. Alleen zichtbaar op Preview.
        </p>
      </header>

      <section>
        <h2 className="rp-h2-sub mb-6">Componenten (RP-21)</h2>
        <ComponentsDemo />
      </section>

      <section>
        <h2 className="rp-h2-sub mb-6">Kleuren</h2>
        <Reveal stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {COLORS.map(([name, hex, cls]) => (
            <div key={name} className="border-border overflow-hidden border">
              <div className={`${cls} h-16`} />
              <div className="p-3 text-[13px]">
                <div className="font-semibold">{name}</div>
                <div className="text-muted-2">{hex}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      <section>
        <h2 className="rp-h2-sub mb-6">Typografie (Outfit)</h2>
        <div className="flex flex-col gap-4">
          <p className="rp-eyebrow">Eyebrow · 13px 600 uppercase</p>
          <p className="rp-h1-home">H1 homepagina · Vergelijk padelrackets</p>
          <p className="rp-h1">H1 · Adidas Metalbone 2026</p>
          <p className="rp-h2">H2 sectie · Uitgelichte deals</p>
          <p className="text-[20px] leading-[1.25] font-semibold">H3 kaart · Bullpadel Vertex 04</p>
          <p className="text-ink-2 max-w-[var(--container-read)] text-[17px] leading-[1.65]">
            Body 17px. Vergelijk prijzen bij meer dan 24 winkels, bekijk de prijshistorie en klik
            door naar de winkel met de beste deal.
          </p>
          <p className="text-muted-2 text-[13px]">Meta 13px · minimale tekstgrootte</p>
          <p>
            <a href="#links" className="rp-underline font-medium">
              Onderstreepte link (hover)
            </a>
          </p>
        </div>
      </section>

      <section>
        <h2 className="rp-h2-sub mb-6">Schuine vormen (6px afgerond)</h2>
        <div className="flex flex-wrap items-center gap-6">
          {SLANTS.map((size) => (
            <Slant
              key={size}
              size={size}
              className="text-lime bg-green-950 px-6 py-4 text-[15px] font-semibold"
            >
              {size}px
            </Slant>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Slant
            as="button"
            type="button"
            size={8}
            className="bg-lime hover:bg-lime-hover inline-flex min-h-11 items-center gap-2 px-6 py-3 font-semibold text-green-950"
          >
            Primaire knop <Arrow />
          </Slant>
          <Slant
            as="button"
            type="button"
            size={8}
            className="inline-flex min-h-11 items-center gap-2 bg-green-950 px-6 py-3 font-semibold text-white hover:bg-green-800"
          >
            Bekijk beste prijs{" "}
            <span className="text-lime">
              <Arrow />
            </span>
          </Slant>
          <Slant
            as="span"
            size={5}
            className="text-lime bg-green-950 px-2.5 py-1 text-[13px] font-semibold"
          >
            -18%
          </Slant>
          <Slant as="span" size={5} className="bg-surface px-2.5 py-1 text-[13px] font-medium">
            Gevorderd
          </Slant>
        </div>
        <p className="text-muted-2 mt-4 text-[13px]">
          Tab naar een knop: de clip-path valt weg zodat de focusring zichtbaar blijft.
        </p>
      </section>

      <section className="rp-slant-block rp-on-dark bg-green-950 px-[var(--rp-gutter)] py-20 text-white">
        <p className="rp-eyebrow">Groot vlak · 24px schuin</p>
        <h2 className="rp-h2 mt-2">Merkenblok en footer</h2>
        <p className="text-on-dark mt-3">Zonder afronding, zoals in de handover.</p>
      </section>

      <section>
        <h2 className="rp-h2-sub mb-6">Schaduwen</h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {[
            ["card-hover", "shadow-card-hover"],
            ["menu", "shadow-menu"],
            ["header", "shadow-header"],
            ["cookie", "shadow-cookie"],
          ].map(([name, cls]) => (
            <div key={name} className={`${cls} bg-white p-6 text-[13px] font-semibold`}>
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="rp-hero rp-on-dark p-10 text-white">
        <p className="rp-eyebrow">Hero-gradient</p>
        <p className="rp-h2 mt-2">radial-gradient 70% 80% at 45% 45%</p>
      </section>
    </main>
  );
}
