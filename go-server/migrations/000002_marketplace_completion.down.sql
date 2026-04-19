DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS licenses;

CREATE TABLE IF NOT EXISTS licenses (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    slug TEXT UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT,
    cover_image TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS testimonials_user_id_product_id_key;
DROP INDEX IF EXISTS licenses_user_id_product_id_order_id_key;
DROP INDEX IF EXISTS reviews_user_id_product_id_key;

ALTER TABLE site_configs
    DROP COLUMN IF EXISTS ai_settings,
    DROP COLUMN IF EXISTS contact,
    DROP COLUMN IF EXISTS showcase_items,
    DROP COLUMN IF EXISTS social_proof,
    DROP COLUMN IF EXISTS faqs;

ALTER TABLE reviews
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS verified_purchase,
    DROP COLUMN IF EXISTS status;

ALTER TABLE orders
    DROP COLUMN IF EXISTS entitlement_status;

ALTER TABLE products
    DROP COLUMN IF EXISTS pages,
    DROP COLUMN IF EXISTS features;

ALTER TABLE users
    DROP COLUMN IF EXISTS suspended;
