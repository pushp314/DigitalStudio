ALTER TABLE products
    ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS og_image VARCHAR(255);

CREATE INDEX IF NOT EXISTS products_slug_idx ON products (slug);
CREATE INDEX IF NOT EXISTS products_category_type_idx ON products (category, type);
CREATE INDEX IF NOT EXISTS products_moderation_status_idx ON products (moderation_status);
