/**
 * Minimal Markdown for blog articles (RP-51). Supported:
 * - `## Heading` and `### Subheading`
 * - paragraphs (blank line between)
 * - `- item` lists and `1. item` lists
 * - inline `**bold**` and `[text](/path)` or `[text](https://…)`
 * Anything else stays plain text. Raw HTML is never rendered.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "h2"; id: string; children: Inline[] }
  | { type: "h3"; children: Inline[] }
  | { type: "p"; children: Inline[] }
  | { type: "ul" | "ol"; items: Inline[][] };

const LINK = /\[([^\]]+)\]\(((?:\/|https:\/\/)[^\s)]*)\)/;
const STRONG = /\*\*([^*]+)\*\*/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  while (rest.length > 0) {
    const link = LINK.exec(rest);
    const strong = STRONG.exec(rest);
    const next = [link, strong]
      .filter((m): m is RegExpExecArray => m !== null)
      .sort((a, b) => a.index - b.index)[0];
    if (!next) {
      out.push({ type: "text", text: rest });
      break;
    }
    if (next.index > 0) out.push({ type: "text", text: rest.slice(0, next.index) });
    if (next === link) {
      out.push({ type: "link", href: next[2]!, children: parseInline(next[1]!) });
    } else {
      out.push({ type: "strong", children: parseInline(next[1]!) });
    }
    rest = rest.slice(next.index + next[0].length);
  }
  return out;
}

/** Plain text of inline nodes, e.g. for heading ids. */
export function inlineText(nodes: Inline[]): string {
  return nodes.map((n) => (n.type === "text" ? n.text : inlineText(n.children))).join("");
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const usedIds = new Set<string>();
  const chunks = source.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    let i = 0;
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.startsWith("### ")) {
        blocks.push({ type: "h3", children: parseInline(line.slice(4)) });
        i++;
      } else if (line.startsWith("## ")) {
        const children = parseInline(line.slice(3));
        let id = headingId(inlineText(children)) || "sectie";
        for (let n = 2; usedIds.has(id); n++) id = `${headingId(inlineText(children))}-${n}`;
        usedIds.add(id);
        blocks.push({ type: "h2", id, children });
        i++;
      } else if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
        const ordered = /^\d+\. /.test(line);
        const marker = ordered ? /^\d+\. / : /^[-*] /;
        const items: Inline[][] = [];
        while (i < lines.length && marker.test(lines[i]!)) {
          items.push(parseInline(lines[i]!.replace(marker, "")));
          i++;
        }
        blocks.push({ type: ordered ? "ol" : "ul", items });
      } else {
        const para: string[] = [];
        while (
          i < lines.length &&
          !/^#{2,3} /.test(lines[i]!) &&
          !/^[-*] /.test(lines[i]!) &&
          !/^\d+\. /.test(lines[i]!)
        ) {
          para.push(lines[i]!);
          i++;
        }
        blocks.push({ type: "p", children: parseInline(para.join(" ")) });
      }
    }
  }
  return blocks;
}

/** Reading time at ~200 words per minute (Dutch prose), at least 1 minute. */
export function readingMinutes(source: string): number {
  const words = source.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
