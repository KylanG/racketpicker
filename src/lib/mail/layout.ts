/**
 * Minimal branded mail (RP-32): table layout and inline styles, because mail clients
 * ignore most CSS. Text is escaped; only `button` becomes a link.
 */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function mailLayout(o: {
  title: string;
  paragraphs: string[];
  button: { label: string; href: string };
  footer: string[];
}): string {
  const p = (t: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0B2A17">${escapeHtml(t)}</p>`;
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#F3F7EE;font-family:Outfit,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F7EE;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#033A19;padding:24px 32px;color:#C8E63A;font-size:22px;font-weight:700;letter-spacing:.5px">RACKETPICKER</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;color:#0B2A17">${escapeHtml(o.title)}</h1>
${o.paragraphs.map(p).join("\n")}
<p style="margin:24px 0"><a href="${escapeHtml(o.button.href)}" style="display:inline-block;background:#C8E63A;color:#033A19;font-weight:700;font-size:16px;padding:14px 24px;text-decoration:none">${escapeHtml(o.button.label)}</a></p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #DCE6D6;font-size:13px;line-height:1.5;color:#3C5A47">
${o.footer.map((f) => `<p style="margin:0 0 8px">${escapeHtml(f)}</p>`).join("\n")}
</td></tr></table></td></tr></table></body></html>`;
}
