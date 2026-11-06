import { describe, expect, it } from "vitest";
import { escapeHtml, mailLayout } from "../layout";
import { hashToken, isTokenShape, newToken } from "../tokens";

describe("mail tokens", () => {
  it("makes URL-safe tokens and stores only their hash", () => {
    const { token, hash } = newToken();
    expect(isTokenShape(token)).toBe(true);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
    expect(isTokenShape("x")).toBe(false);
    expect(isTokenShape(undefined)).toBe(false);
  });
});

describe("mailLayout", () => {
  it("escapes text", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
    const html = mailLayout({
      title: "Hoi <b>",
      paragraphs: ["Tekst"],
      button: { label: "Klik", href: "https://racketpicker.com/a?b=1&c=2" },
      footer: [],
    });
    expect(html).toContain("Hoi &lt;b&gt;");
    expect(html).toContain('href="https://racketpicker.com/a?b=1&amp;c=2"');
  });
});
