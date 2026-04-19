-- Showcase table for user submissions
CREATE TABLE IF NOT EXISTS showcases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    live_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reward_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index to prevent duplicate submissions for the same user and product
CREATE UNIQUE INDEX IF NOT EXISTS showcases_user_id_product_id_key ON showcases (user_id, product_id);
