import type { formats } from "./i18n/formats";
import type { routing } from "./i18n/routing";
import type messages from "../messages/nl.json";

// Typed locales, message keys and format names for next-intl.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
