import { parse } from "csv-parse/sync";
import { gunzipSync } from "node:zlib";
import type { RawRow } from "./types";

/** Gunzips when the buffer starts with the gzip magic bytes, otherwise returns it as text. */
export function decodeFeed(buffer: Uint8Array): string {
  const isGzip = buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  const bytes = isGzip ? gunzipSync(buffer) : buffer;
  return new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
}

/** Picks the delimiter that appears most in the header line: comma, semicolon, tab or pipe. */
export function detectDelimiter(text: string): string {
  const header = text.slice(0, text.indexOf("\n") === -1 ? undefined : text.indexOf("\n"));
  const candidates = [",", ";", "\t", "|"];
  return candidates.reduce((best, d) =>
    header.split(d).length > header.split(best).length ? d : best,
  );
}

export function parseCsv(text: string): RawRow[] {
  return parse(text, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    delimiter: detectDelimiter(text),
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true,
  }) as RawRow[];
}
