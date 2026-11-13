import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, type NewProduct } from "./bol-discovery";

type Db = ReturnType<typeof createAdminClient>;

/**
 * Stores new catalog products, from bol (RP-77) or an affiliate feed (RP-91): published
 * with content tier C (noindex until their content is filled in). Creates the brand when
 * needed. A product whose content cannot be stored is removed again, so no product is left
 * without a page. Returns how many were created; failures go to `skipped`.
 */
export async function insertProducts(
  db: Db,
  todo: NewProduct[],
  skipped: string[],
): Promise<number> {
  const { data: brands, error: brandsError } = await db.from("brands").select("id, name");
  if (brandsError) throw new Error(`brands: ${brandsError.message}`);
  const brandId = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));

  let created = 0;
  for (const p of todo) {
    try {
      let id = brandId.get(p.brand.toLowerCase());
      if (!id) {
        const { data, error } = await db
          .from("brands")
          .upsert({ slug: slugify(p.brand), name: p.brand }, { onConflict: "slug" })
          .select("id")
          .single();
        if (error) throw new Error(`brand: ${error.message}`);
        id = data.id;
        brandId.set(p.brand.toLowerCase(), id);
      }
      const { data: product, error } = await db
        .from("products")
        .insert({
          brand_id: id,
          category_key: p.category,
          sport_key: p.sport,
          model: p.model,
          model_year: p.year,
          gtins: [p.ean],
          tier: "C",
          status: "published",
          is_sample: false,
          product_type: p.productType,
        })
        .select("id")
        .single();
      if (error) throw new Error(`product: ${error.message}`);
      const { error: contentError } = await db.from("product_content").insert({
        product_id: product.id,
        market_code: "nl",
        slug: p.slug,
        title: p.title,
        is_published: true,
      });
      if (contentError) {
        await db.from("products").delete().eq("id", product.id);
        throw new Error(`content: ${contentError.message}`);
      }
      created++;
    } catch (e) {
      skipped.push(`${p.ean} ${p.title}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return created;
}
