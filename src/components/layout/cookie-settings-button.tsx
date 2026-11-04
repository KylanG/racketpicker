"use client";

/** Reopens the cookie banner with its settings; the banner (RP-35) listens for this event. */
export const OPEN_COOKIE_SETTINGS_EVENT = "rp:open-cookie-settings";

export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className={className}
    >
      {label}
    </button>
  );
}
