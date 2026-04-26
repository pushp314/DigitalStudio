DROP INDEX IF EXISTS products_moderation_status_idx;
DROP INDEX IF EXISTS products_category_type_idx;
DROP INDEX IF EXISTS products_slug_idx;

ALTER TABLE products
    DROP COLUMN IF EXISTS og_image,
    DROP COLUMN IF EXISTS seo_description,
    DROP COLUMN IF EXISTS seo_title;
