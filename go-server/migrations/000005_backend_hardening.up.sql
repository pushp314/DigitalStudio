CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_purchase NUMERIC(10,2) NOT NULL DEFAULT 0,
    usage_limit INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS coupons_active_code_idx ON coupons (active, code);

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    reply TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sentiment VARCHAR(50) NOT NULL DEFAULT 'neutral',
    priority INTEGER NOT NULL DEFAULT 1,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS contact_inquiries_user_id_idx ON contact_inquiries (user_id);
CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx ON contact_inquiries (status);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_created_at_idx ON chat_messages (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(128),
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(120) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id BIGINT,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_request_id_idx ON audit_logs (request_id);
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs (resource_type, resource_id);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS subtotal_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS coupon_id BIGINT REFERENCES coupons(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS coupon_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS settlement_source VARCHAR(50),
    ADD COLUMN IF NOT EXISTS partner_reward_settled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS partner_reward_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

UPDATE orders
SET subtotal_price = COALESCE(total_price, 0)
WHERE subtotal_price = 0 AND discount_amount = 0;

CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_key
    ON orders (razorpay_order_id)
    WHERE razorpay_order_id IS NOT NULL AND razorpay_order_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_payment_id_key
    ON orders (razorpay_payment_id)
    WHERE razorpay_payment_id IS NOT NULL AND razorpay_payment_id <> '';

CREATE INDEX IF NOT EXISTS orders_user_created_at_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status, status);
CREATE INDEX IF NOT EXISTS order_items_order_product_idx ON order_items (order_id, product_id);
CREATE INDEX IF NOT EXISTS licenses_order_id_idx ON licenses (order_id);
