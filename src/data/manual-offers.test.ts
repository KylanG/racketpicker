import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateManualOffers } from "@/lib/feeds/manual-offers";
import { MANUAL_OFFERS } from "./manual-offers";

const migrations = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(migrations)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(migrations, f), "utf8"))
  .join("\n");

describe("MANUAL_OFFERS", () => {
  it("passes validation", () => {
    const newest =
      MANUAL_OFFERS.map((o) => o.checkedOn)
        .sort()
        .at(-1) ?? "2026-01-01";
    expect(validateManualOffers(MANUAL_OFFERS, new Date(`${newest}T12:00:00Z`))).toEqual([]);
  });

  it("only uses products and shops that a migration creates", () => {
    for (const o of MANUAL_OFFERS) {
      expect(sql, o.product).toContain(`'${o.product}'`);
      expect(sql, o.shop).toContain(`('${o.shop}',`);
    }
  });

  it("links to the shop's own site", () => {
    const hosts: Record<string, string> = {
      padelshop: "padelshop.com",
      justpadel: "justpadel.com",
      padelmq: "www.padelmq.com",
    };
    for (const o of MANUAL_OFFERS) {
      expect(new URL(o.url).host, `${o.shop}/${o.product}`).toBe(hosts[o.shop]);
    }
  });
});
