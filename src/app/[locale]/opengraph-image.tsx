import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasLocale, type Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

// Default share image (RP-80) for every page without its own, such as WhatsApp and LinkedIn previews.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// The text in the image is translated; the alt text is the brand name.
export const alt = "Racketpicker";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Static files for the image. */
async function loadAssets() {
  const b64 = (b: Buffer) => b.toString("base64");
  const [logo, bold, medium] = await Promise.all([
    readFile(join(process.cwd(), "public", "logo.svg")),
    readFile(join(process.cwd(), "assets", "fonts", "Outfit-Bold.ttf")),
    readFile(join(process.cwd(), "assets", "fonts", "Outfit-Medium.ttf")),
  ]);
  return { logo: b64(logo), bold: b64(bold), medium: b64(medium) };
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const png = await renderPng(hasLocale(routing.locales, locale) ? locale : routing.defaultLocale);
  return new Response(Buffer.from(png, "base64"), {
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400" },
  });
}

/** The image is the same for every visit, so it is rendered once per locale and cached. */
async function renderPng(locale: Locale): Promise<string> {
  "use cache";
  const t = await getTranslations({
    locale,
    namespace: "metadata",
  });
  const { logo, bold, medium } = await loadAssets();
  const logoSrc = `data:image/svg+xml;base64,${logo}`;

  const image = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#033A19",
        fontFamily: "Outfit",
      }}
    >
      <img src={logoSrc} width={285} height={120} alt="" />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#C8E63A",
            maxWidth: 960,
          }}
        >
          {t("shareTitle")}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.35,
            color: "#FFFFFF",
            maxWidth: 940,
          }}
        >
          {t("description")}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Outfit", data: Buffer.from(bold, "base64"), weight: 700, style: "normal" },
        { name: "Outfit", data: Buffer.from(medium, "base64"), weight: 500, style: "normal" },
      ],
    },
  );
  return Buffer.from(await image.arrayBuffer()).toString("base64");
}
