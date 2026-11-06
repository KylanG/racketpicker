import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

// Brand colours from design/handoff/README.md. The name is the brand, so it is not translated.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Racketpicker",
    short_name: "Racketpicker",
    start_url: `/${routing.defaultLocale}`,
    display: "browser",
    background_color: "#033A19",
    theme_color: "#033A19",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
