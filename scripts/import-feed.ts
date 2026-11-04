/**
 * Import an affiliate feed.
 *
 *   npm run feeds:import -- <shop-slug> [--file feed.csv] [--dry-run] [--force]
 *   npm run feeds:import -- --all            (same as the daily cron: all active shops + photos)
 *   npm run feeds:import -- --offline --network awin --file feed.csv [--filter all]
 *
 * --offline parses, filters and matches a local file without any database access
 * (empty catalog), to check that a new feed is read correctly.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { prepareFeed, type FeedFilter } from "../src/lib/feeds/pipeline";
import type { AffiliateNetwork } from "../src/lib/feeds/types";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    file: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    offline: { type: "boolean", default: false },
    all: { type: "boolean", default: false },
    network: { type: "string" },
    filter: { type: "string", default: "padel_rackets" },
    show: { type: "string", default: "10" },
  },
});

async function main() {
  const bytes = values.file ? new Uint8Array(readFileSync(values.file)) : undefined;

  if (values.offline) {
    if (!bytes || !values.network) throw new Error("--offline needs --file and --network");
    const { items, stats } = prepareFeed(
      bytes,
      values.network as AffiliateNetwork,
      values.filter as FeedFilter,
      [],
    );
    console.log(JSON.stringify(stats, null, 2));
    console.table(
      items.slice(0, Number(values.show)).map((i) => ({
        id: i.externalId,
        title: i.title,
        price: i.price,
        stock: i.stockStatus,
        gtin: i.gtin ?? "",
      })),
    );
    return;
  }

  if (values.all) {
    const { runDailyImport } = await import("../src/lib/feeds/run-all");
    console.log(JSON.stringify(await runDailyImport(), null, 2));
    return;
  }

  const shop = positionals[0];
  if (!shop) throw new Error("Usage: npm run feeds:import -- <shop-slug> [--file] [--dry-run]");
  const { runImport } = await import("../src/lib/feeds/run-import");
  const result = await runImport(shop, { bytes, dryRun: values["dry-run"], force: values.force });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
