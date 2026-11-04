"use client";

import { useEffect } from "react";
import { slantClipPath } from "@/lib/ui/slant";

/**
 * Rounds the corners of every `[data-slant]` element (rendered by <Slant>), like
 * reveal.js in the prototype: computes a `path()` clip from the element's size and
 * keeps it in sync on resize and when new elements appear. Mount once in the layout.
 */
export function SlantRounder() {
  useEffect(() => {
    const tracked = new WeakSet<Element>();

    const apply = (el: HTMLElement) => {
      const size = Number(el.dataset.slant);
      const { offsetWidth: w, offsetHeight: h } = el;
      if (size && w && h) el.style.clipPath = slantClipPath(w, h, size);
    };

    const resize = new ResizeObserver((entries) =>
      entries.forEach((e) => apply(e.target as HTMLElement)),
    );

    const track = (root: ParentNode) => {
      const list =
        root instanceof HTMLElement && root.matches("[data-slant]")
          ? [root, ...root.querySelectorAll<HTMLElement>("[data-slant]")]
          : [...root.querySelectorAll<HTMLElement>("[data-slant]")];
      for (const el of list) {
        if (tracked.has(el)) continue;
        tracked.add(el);
        apply(el);
        resize.observe(el);
      }
    };

    track(document);
    const mutations = new MutationObserver((records) =>
      records.forEach((r) =>
        r.addedNodes.forEach((node) => node instanceof HTMLElement && track(node)),
      ),
    );
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return null;
}
