import { describe, expect, it } from "vitest";
import {
  brandFromTitle,
  DISCOVERY_TARGETS,
  modelFromTitle,
  selectNewProducts,
  type BolSearchResult,
} from "../bol-discovery";

const rackets = DISCOVERY_TARGETS.find((t) => t.key === "padel-rackets")!;
const balls = DISCOVERY_TARGETS.find((t) => t.key === "padel-balls")!;
const grips = DISCOVERY_TARGETS.find((t) => t.key === "padel-grips")!;
const bags = DISCOVERY_TARGETS.find((t) => t.key === "padel-bags")!;
const nox = DISCOVERY_TARGETS.find((t) => t.key === "padel-rackets-nox")!;

// Valid EAN-13s (check digit included).
const EAN = ["8435778902621", "8435778902638", "4006381333931", "5901234123457", "4012345678901"];

const result = (title: string, ean = EAN[0], price = 150): BolSearchResult => ({
  ean,
  title,
  offer: { price, condition: "NEW" },
});
const empty = () => ({
  eans: new Set<string>(),
  keys: new Set<string>(),
  slugs: new Set<string>(),
});

describe("brandFromTitle", () => {
  it("finds a known brand at the start, the longest name first", () => {
    expect(brandFromTitle("Bullpadel Vertex 04 2025 - Padelracket")).toBe("Bullpadel");
    expect(brandFromTitle("Royal Padel Whip 2025")).toBe("Royal Padel");
    expect(brandFromTitle("STARVIE Triton Pro")).toBe("StarVie");
    expect(brandFromTitle("Padelracket Bullpadel Hack")).toBeNull();
    expect(brandFromTitle("Merkloos padelracket")).toBeNull();
  });
});

describe("modelFromTitle", () => {
  it("takes the part before the first separator and drops generic words and the year", () => {
    expect(
      modelFromTitle("Adidas Metalbone 3.4 2025 - Padelracket - Zwart/Rood", "Adidas"),
    ).toEqual({
      model: "Metalbone 3.4",
      year: 2025,
    });
    expect(modelFromTitle("Nox AT10 Genius 18K Padel Racket | Agustín Tapia", "Nox")).toEqual({
      model: "AT10 Genius 18K",
      year: null,
    });
    expect(modelFromTitle("Head Padel Pro S, 3 stuks", "Head", "balls")).toEqual({
      model: "Pro S",
      year: null,
    });
  });

  it.each([
    ["Bullpadel Neuron 02 Default 2025 - padelracket", "rackets", "Neuron 02"],
    ["Head Evo Kleur : Speed 2025 padelracket", "rackets", "Evo Speed"],
    ["Bullpadel Vertex 04 Comfort (Diamant) padelracket", "rackets", "Vertex 04 Comfort"],
    [
      "Nox ML10 PRO CUP SILVER LIGHT miguel lamperti 2027",
      "rackets",
      "ML10 PRO CUP LIGHT Miguel Lamperti",
    ],
    ["Bullpadel Game Pwr Grey padel racket", "rackets", "Game Pwr"],
    ["Puma Nova COURT 049050 padelracket", "rackets", "Nova COURT"],
    ["Head Padelballen Pro S", "balls", "Pro S"],
    ["Head Pro S Ballen (3-pack)", "balls", "Pro S"],
    ["Head One Padelballen 1 blik van 3 ballen", "balls", "One"],
    ["Babolat Court padelballen ballen 3x3", "balls", "Court"],
    ["Bullpadel Overgrip GB-1201 ( ) 3 stuks Kleur : Zwart", "grips", "Overgrip GB-1201"],
    ["Wilson Pro Overgrip Box Wit (60 Stuks)", "grips", "Pro Overgrip"],
    ["Head Xtreme Soft 3 Pack Tennis", "grips", "Xtreme Soft"],
    ["Nox AT10 Team tas Grijs 1", "bags", "AT10 Team"],
    ["Nox AT10 Team Grijsgroene Padeltas", "bags", "AT10 Team"],
    ["Bullpadel BPP26003 Vertex W Premier Racketbag Default", "bags", "Vertex W Premier"],
    ["Head Core Ultimate tas racketbag grijs-wit", "bags", "Core Ultimate"],
    ["Head Core Ultimate Padeltas Zwart-Oranje", "bags", "Core Ultimate"],
    ["Adidas Control Padeltas 2026", "bags", "Control"],
    ["Head Speed Motion (Druppel) 2025 padelracket", "rackets", "Speed Motion"],
  ] as const)("cleans %s", (title, kind, model) => {
    expect(modelFromTitle(title, title.split(" ")[0]!, kind).model).toBe(model);
  });

  it("drops glued generic words", () => {
    expect(modelFromTitle("Dunlop PadelracketVolwassenen", "Dunlop").model).toBe("");
  });
});

describe("brand racket searches", () => {
  it("has one search per brand, after the general searches", () => {
    expect(nox.searchTerm).toBe("Nox padel racket");
    expect(DISCOVERY_TARGETS.findIndex((t) => t.key === "padel-rackets-nox")).toBeGreaterThan(
      DISCOVERY_TARGETS.findIndex((t) => t.key === "padel-bags"),
    );
    expect(DISCOVERY_TARGETS.some((t) => t.key === "padel-rackets-vibor-a")).toBe(true);
  });

  it("only takes rackets, not the brand's shoes, clothing or covers", () => {
    const picked = selectNewProducts(
      [
        result("Nox AT10 Luxury Genius 18K 2025 - Padelracket", EAN[0]),
        result("Nox AT10 padel schoenen - wit", EAN[1]),
        result("Nox Team padel shirt heren", EAN[2]),
        result("Nox padelracket hoes", EAN[3]),
      ],
      nox,
      empty(),
    );
    expect(picked.map((p) => p.ean)).toEqual([EAN[0]]);
  });
});

describe("selectNewProducts", () => {
  it("keeps real rackets of known brands and skips covers, kids and junk", () => {
    const picked = selectNewProducts(
      [
        result("Bullpadel Vertex 04 2025 - Padelracket", EAN[0]),
        result("Bullpadel padelracket hoes - zwart", EAN[1]),
        result("Adidas Drive Junior padel racket", EAN[2]),
        result("Merkloos padel racket carbon", EAN[3]),
        result("Head Speed MP tennisracket", EAN[4]),
      ],
      rackets,
      empty(),
    );
    expect(picked).toEqual([
      {
        ean: EAN[0],
        brand: "Bullpadel",
        model: "Vertex 04",
        year: 2025,
        title: "Bullpadel Vertex 04 2025",
        slug: "bullpadel-vertex-04-2025",
        category: "rackets",
        sport: "padel",
        productType: null,
      },
    ]);
  });

  it("skips known EANs, colour variants of the same model, cheap and used offers", () => {
    const known = empty();
    known.eans.add(EAN[0]);
    const picked = selectNewProducts(
      [
        result("Nox AT10 Genius 2025 - Padelracket", EAN[0]),
        result("Nox ML10 Pro Cup 2025 - Padelracket - Wit", EAN[1]),
        result("Nox ML10 Pro Cup 2025 - Padelracket - Zwart", EAN[2]),
        result("Nox X-One padelracket", EAN[3], 25),
        { ...result("Nox Equation padelracket", EAN[4]), offer: { price: 120, condition: "USED" } },
      ],
      rackets,
      known,
    );
    expect(picked.map((p) => p.slug)).toEqual(["nox-ml10-pro-cup-2025"]);
  });

  it("adds an EAN suffix when the slug is taken by another product", () => {
    const known = empty();
    known.slugs.add("nox-ml10-pro-cup-2025");
    expect(
      selectNewProducts([result("Nox ML10 Pro Cup 2025 - Padelracket", EAN[1])], rackets, known)[0]!
        .slug,
    ).toBe("nox-ml10-pro-cup-2025-2638");
  });

  it("recognises balls, grips and bags", () => {
    expect(
      selectNewProducts(
        [result("Head Padel Pro S - Padelballen - 3 stuks", EAN[0], 8)],
        balls,
        empty(),
      ).map((p) => [p.productType, p.title]),
    ).toEqual([["balls", "Head Pro S"]]);
    expect(
      selectNewProducts([result("Bullpadel GB-1200 Overgrip - 3 stuks", EAN[1], 7)], grips, empty())
        .length,
    ).toBe(1);
    expect(
      selectNewProducts(
        [
          result("Adidas Multigame padeltas - zwart", EAN[2], 59),
          result("Adidas Metalbone padel racket", EAN[3], 59),
        ],
        bags,
        empty(),
      ).map((p) => p.brand),
    ).toEqual(["Adidas"]);
  });
});
