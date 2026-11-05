"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Product photos (design/handoff/Product.dc.html): large square photo on surface-2 with
 * multiply blending, thumbnails on the left when there is more than one photo.
 */
export function ProductGallery({
  images,
  noImage,
  photoLabel,
  badge,
}: {
  images: { src: string; alt: string }[];
  noImage: string;
  /** "Foto {n}" with {n} already replaced per thumbnail. */
  photoLabel: string[];
  badge?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className={images.length > 1 ? "grid grid-cols-[72px_minmax(0,1fr)] gap-4" : ""}>
      {images.length > 1 && (
        <div className="flex flex-col gap-2.5">
          {images.slice(0, 4).map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={photoLabel[i]}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`bg-surface-2 relative grid size-[72px] cursor-pointer place-items-center overflow-hidden border-[1.5px] ${
                i === index ? "border-green-950" : "border-border"
              }`}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="72px"
                className="object-contain p-1.5 mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}
      <div className="bg-surface-2 relative grid aspect-square place-items-center overflow-hidden">
        {badge && (
          <span
            className="text-lime absolute top-4 left-4 z-1 bg-green-950 px-3 py-1.5 text-[13px] font-semibold"
            style={{ clipPath: "polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)" }}
          >
            {badge}
          </span>
        )}
        {current ? (
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1040px) 45vw, 100vw"
            className="object-contain p-[9%] mix-blend-multiply"
          />
        ) : (
          <span className="text-muted-2 text-[15px]">{noImage}</span>
        )}
      </div>
    </div>
  );
}
