import { describe, expect, it } from "vitest";
import { headingId, parseInline, parseMarkdown, readingMinutes } from "./markdown";

describe("parseInline", () => {
  it("parses bold and links", () => {
    expect(parseInline("Kies **rond** of [kijk hier](/nl/rackets/padel).")).toEqual([
      { type: "text", text: "Kies " },
      { type: "strong", children: [{ type: "text", text: "rond" }] },
      { type: "text", text: " of " },
      { type: "link", href: "/nl/rackets/padel", children: [{ type: "text", text: "kijk hier" }] },
      { type: "text", text: "." },
    ]);
  });

  it("does not turn javascript: or http: links into links", () => {
    expect(parseInline("[x](javascript:alert(1))")).toEqual([
      { type: "text", text: "[x](javascript:alert(1))" },
    ]);
    expect(parseInline("[x](http://a.nl)")[0]).toEqual({ type: "text", text: "[x](http://a.nl)" });
  });

  it("keeps HTML as text", () => {
    expect(parseInline("<script>x</script>")).toEqual([
      { type: "text", text: "<script>x</script>" },
    ]);
  });
});

describe("parseMarkdown", () => {
  it("parses headings, paragraphs and lists", () => {
    const blocks = parseMarkdown(
      "## Rond of diamant?\n\nEerste regel\ntweede regel.\n\n- een\n- twee\n\n1. a\n2. b\n\n### Klein",
    );
    expect(blocks.map((b) => b.type)).toEqual(["h2", "p", "ul", "ol", "h3"]);
    expect(blocks[0]).toMatchObject({ id: "rond-of-diamant" });
    expect(blocks[1]).toEqual({
      type: "p",
      children: [{ type: "text", text: "Eerste regel tweede regel." }],
    });
    expect(blocks[2]).toMatchObject({ items: [[{ text: "een" }], [{ text: "twee" }]] });
  });

  it("gives duplicate headings unique ids", () => {
    const ids = parseMarkdown("## Prijs\n\n## Prijs").map((b) => (b.type === "h2" ? b.id : ""));
    expect(ids).toEqual(["prijs", "prijs-2"]);
  });
});

describe("helpers", () => {
  it("makes ascii heading ids", () => {
    expect(headingId("Wat kost een goed racket? (€ 100–200)")).toBe(
      "wat-kost-een-goed-racket-100-200",
    );
    expect(headingId("Één keer")).toBe("een-keer");
  });

  it("estimates reading time", () => {
    expect(readingMinutes("woord ".repeat(1000))).toBe(5);
    expect(readingMinutes("kort")).toBe(1);
  });
});
