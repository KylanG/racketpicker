import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** File extension for an allowed image content type, or null when not allowed. */
export function imageExtension(contentType: string | null): string | null {
  if (!contentType) return null;
  return EXTENSIONS[contentType.split(";")[0]!.trim().toLowerCase()] ?? null;
}

export type ImageCandidate = { productId: string; imageUrl: string; title: string };

/**
 * One photo per product that has none yet, taken from its matched feed items.
 * Pure function so the selection rules are testable.
 */
export function pickImagesToSync(
  candidates: ImageCandidate[],
  productsWithImages: Set<string>,
  limit: number,
): ImageCandidate[] {
  const picked = new Map<string, ImageCandidate>();
  for (const c of candidates) {
    if (picked.size >= limit) break;
    if (productsWithImages.has(c.productId) || picked.has(c.productId)) continue;
    picked.set(c.productId, c);
  }
  return [...picked.values()];
}

export type ImageSyncResult = {
  attempted: number;
  stored: number;
  failed: string[];
  /** Photos not started because the run's time budget ran out (RP-92); next run. */
  postponed?: number;
};

/** Photos downloaded at the same time: one by one took minutes for a big batch (RP-92). */
const CONCURRENCY = 6;

/**
 * Copies feed photos into Supabase Storage for products without photos, so the site
 * does not hotlink shop images. Bounded per run, and no new photo starts after
 * `deadline` (epoch ms), to keep the cron within its time limit.
 */
export async function syncProductImages(
  limit = 25,
  deadline = Number.POSITIVE_INFINITY,
): Promise<ImageSyncResult> {
  const db = createAdminClient();

  const [{ data: items, error: itemsError }, { data: existing, error: existingError }] =
    await Promise.all([
      db
        .from("feed_items")
        .select("matched_product_id, image_url, title")
        .eq("match_status", "matched")
        .eq("is_active", true)
        .not("matched_product_id", "is", null)
        .not("image_url", "is", null)
        .limit(1000),
      db.from("product_images").select("product_id"),
    ]);
  if (itemsError) throw new Error(`Loading feed images failed: ${itemsError.message}`);
  if (existingError) throw new Error(`Loading product images failed: ${existingError.message}`);

  const todo = pickImagesToSync(
    items.map((i) => ({
      productId: i.matched_product_id!,
      imageUrl: i.image_url!,
      title: i.title,
    })),
    new Set(existing.map((e) => e.product_id)),
    limit,
  );

  const result: ImageSyncResult = { attempted: 0, stored: 0, failed: [], postponed: 0 };
  const queue = [...todo];
  const worker = async () => {
    for (let candidate = queue.shift(); candidate; candidate = queue.shift()) {
      if (Date.now() >= deadline) {
        result.postponed!++;
        continue;
      }
      result.attempted++;
      await storeImage(db, candidate, result);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return result;
}

async function storeImage(
  db: ReturnType<typeof createAdminClient>,
  candidate: { productId: string; imageUrl: string; title: string },
  result: ImageSyncResult,
): Promise<void> {
  try {
    const response = await fetch(candidate.imageUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const ext = imageExtension(response.headers.get("content-type"));
    if (!ext) throw new Error(`unsupported type ${response.headers.get("content-type")}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) throw new Error("image larger than 5 MB");

    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const path = `products/${candidate.productId}/${hash}.${ext}`;
    const { error: uploadError } = await db.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, bytes, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);

    const { error: insertError } = await db.from("product_images").insert({
      product_id: candidate.productId,
      storage_path: path,
      alt: candidate.title,
      position: 0,
      source_url: candidate.imageUrl,
    });
    if (insertError) throw new Error(insertError.message);
    result.stored++;
  } catch (error) {
    result.failed.push(
      `${candidate.productId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
