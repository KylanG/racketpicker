import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOL_SITE_ID,
  bolAffiliateUrl,
  fetchBolItems,
  getBestOffer,
  getMedia,
  pickBolImage,
  offerToItem,
  validGtin,
  type BolOffer,
} from "../bol";
import type { CatalogProduct } from "../types";

const product: CatalogProduct = {
  id: "p1",
  brand: "Nox",
  model: "AT10 Genius 18K Alum",
  modelYear: 2026,
  gtins: ["8435778902621"],
};

const offer: BolOffer = {
  ean: "8435778902621",
  condition: "NEW",
  isPreOrder: false,
  price: 219.99,
  minDeliveryDate: "2026-11-06",
  maxDeliveryDate: "2026-11-07",
  url: "https://www.bol.com/nl/nl/p/nox-at10/9300000123/",
  seller: { name: "bol" },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("validGtin", () => {
  it("accepts every EAN in the bol migration", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20261105100500_bol_shop.sql"),
      "utf8",
    );
    const eans = [...sql.matchAll(/'\{(\d+)\}/g)].map((m) => m[1]!);
    expect(eans).toHaveLength(19);
    for (const ean of eans) {
      expect(ean, ean).toHaveLength(13);
      expect(validGtin(ean), ean).toBe(true);
    }
  });

  it("rejects wrong check digits and lengths", () => {
    expect(validGtin("8435778902622")).toBe(false);
    expect(validGtin("12345")).toBe(false);
  });
});

describe("bolAffiliateUrl", () => {
  it("uses the Racketpicker site code", () => {
    const url = new URL(bolAffiliateUrl(offer.url));
    expect(url.host).toBe("partner.bol.com");
    expect(url.searchParams.get("s")).toBe(BOL_SITE_ID);
    expect(BOL_SITE_ID).toBe("1556484");
    expect(url.searchParams.get("url")).toBe(offer.url);
  });
});

describe("offerToItem", () => {
  const today = new Date("2026-11-05T08:00:00Z");

  it("maps an offer to a matched item", () => {
    expect(offerToItem(offer, product, offer.ean, today)).toMatchObject({
      externalId: "bol:8435778902621",
      title: "Nox AT10 Genius 18K Alum 2026",
      gtin: "8435778902621",
      price: 219.99,
      stockStatus: "in_stock",
      deliveryDaysMin: 1,
      deliveryDaysMax: 2,
      productUrl: offer.url,
      match: { status: "matched", method: "gtin", productId: "p1" },
    });
  });

  it("marks pre-orders and skips used or broken offers", () => {
    expect(
      offerToItem({ ...offer, isPreOrder: true }, product, offer.ean, today)?.stockStatus,
    ).toBe("preorder");
    expect(
      offerToItem({ ...offer, condition: "SECOND_HAND" }, product, offer.ean, today),
    ).toBeNull();
    expect(offerToItem({ ...offer, price: 0 }, product, offer.ean, today)).toBeNull();
    expect(offerToItem({ ...offer, url: "javascript:x" }, product, offer.ean, today)).toBeNull();
  });
});

describe("getBestOffer", () => {
  it("returns null on 404 and retries on 429", async () => {
    const f = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({}, 429))
      .mockResolvedValueOnce(json(offer));
    const wait = vi.fn(async () => {});
    expect(await getBestOffer(offer.ean, "t", f, wait)).toEqual(offer);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(String(f.mock.calls[0]![0])).toContain("include-seller=true");

    expect(
      await getBestOffer(
        offer.ean,
        "t",
        vi.fn<typeof fetch>(async () => json({}, 404)),
      ),
    ).toBeNull();
  });

  it("throws on other errors", async () => {
    await expect(
      getBestOffer(
        offer.ean,
        "t",
        vi.fn<typeof fetch>(async () => json({}, 401)),
      ),
    ).rejects.toThrow("HTTP 401");
  });
});

const media = {
  ean: offer.ean,
  images: [
    {
      order: 1,
      mimeType: "image/jpeg",
      renditions: [{ width: 1200, height: 1200, url: "https://media.s-bol.com/side-1200.jpg" }],
    },
    {
      order: 0,
      mimeType: "image/jpeg",
      renditions: [
        { width: 168, height: 168, url: "https://media.s-bol.com/front-168.jpg" },
        { width: 1200, height: 1200, url: "https://media.s-bol.com/front-1200.jpg" },
        { width: 4000, height: 4000, url: "https://media.s-bol.com/front-4000.jpg" },
      ],
    },
  ],
};

describe("pickBolImage", () => {
  it("takes the first image in the largest rendition up to 1200px", () => {
    expect(pickBolImage(media)).toBe("https://media.s-bol.com/front-1200.jpg");
  });

  it("falls back to the smallest larger rendition, and null without images", () => {
    const big = {
      images: [
        {
          order: 0,
          renditions: [
            { width: 4000, height: 4000, url: "https://media.s-bol.com/a.jpg" },
            { width: 2000, height: 2000, url: "https://media.s-bol.com/b.jpg" },
          ],
        },
      ],
    };
    expect(pickBolImage(big)).toBe("https://media.s-bol.com/b.jpg");
    expect(pickBolImage({ images: [] })).toBeNull();
    expect(pickBolImage(null)).toBeNull();
    expect(
      pickBolImage({
        images: [{ order: 0, renditions: [{ width: 500, height: 500, url: "http://x" }] }],
      }),
    ).toBeNull();
  });
});

describe("getMedia", () => {
  it("pads 12-digit codes and never throws", async () => {
    const f = vi.fn<typeof fetch>(async () => json(media));
    expect(await getMedia("842776106209", "t", f)).toEqual(media);
    expect(String(f.mock.calls[0]![0])).toContain("/products/0842776106209/media");

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      await getMedia(
        offer.ean,
        "t",
        vi.fn<typeof fetch>(async () => json({}, 401)),
      ),
    ).toBeNull();
    expect(
      await getMedia(
        offer.ean,
        "t",
        vi.fn<typeof fetch>(async () => Promise.reject(new Error("down"))),
      ),
    ).toBeNull();
    expect(
      await getMedia(
        offer.ean,
        "t",
        vi.fn<typeof fetch>(async () => json({}, 404)),
      ),
    ).toBeNull();
    warn.mockRestore();
  });
});

describe("fetchBolItems", () => {
  beforeEach(() => {
    vi.stubEnv("BOL_CLIENT_ID", "id");
    vi.stubEnv("BOL_CLIENT_SECRET", "secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  const wait = async () => {};

  it("asks one offer per product and counts the results", async () => {
    const catalog: CatalogProduct[] = [
      product,
      { ...product, id: "p2", model: "Zonder aanbod", gtins: ["8435778902638"] },
      { ...product, id: "p3", model: "Zonder EAN", gtins: [] },
    ];
    const f = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.startsWith("https://login.bol.com")) return json({ access_token: "tok" });
      if (url.includes("8435778902621")) return json(offer);
      return json({}, 404);
    });
    const { items, stats } = await fetchBolItems(catalog, { fetcher: f, wait });
    expect(items[0]!.imageUrl).toBeNull();
    expect(items.map((i) => i.match)).toEqual([
      { status: "matched", method: "gtin", productId: "p1", score: 1 },
    ]);
    expect(stats).toMatchObject({ rows: 2, kept: 1, matchedByGtin: 1, filteredOut: 1 });
    const tokenCall = f.mock.calls.find((c) => String(c[0]).startsWith("https://login.bol.com"))!;
    expect((tokenCall[1]!.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("id:secret").toString("base64")}`,
    );
  });

  it("adds the photo of the EAN with the offer", async () => {
    const f = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.startsWith("https://login.bol.com")) return json({ access_token: "tok" });
      if (url.endsWith("/media")) return json(media);
      return json(offer);
    });
    const { items } = await fetchBolItems([product], { fetcher: f, wait });
    expect(items[0]!.imageUrl).toBe("https://media.s-bol.com/front-1200.jpg");
  });

  it("does not call bol without products with an EAN", async () => {
    const f = vi.fn<typeof fetch>();
    expect((await fetchBolItems([{ ...product, gtins: [] }], { fetcher: f, wait })).items).toEqual(
      [],
    );
    expect(f).not.toHaveBeenCalled();
  });

  it("fails the run without credentials", async () => {
    vi.stubEnv("BOL_CLIENT_SECRET", "");
    await expect(fetchBolItems([product], { fetcher: vi.fn(), wait })).rejects.toThrow(
      "BOL_CLIENT_ID or BOL_CLIENT_SECRET",
    );
  });
});
