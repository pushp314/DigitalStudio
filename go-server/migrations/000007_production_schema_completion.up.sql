CREATE TABLE IF NOT EXISTS product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_intents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    headline VARCHAR(255),
    subheadline VARCHAR(255),
    description TEXT,
    cta VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expert_intents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    headline VARCHAR(255),
    subheadline VARCHAR(255),
    description TEXT,
    cta VARCHAR(100),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    base_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(50),
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS website VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS github VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS github_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS twitter VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS partner_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS referrer_id BIGINT,
    ADD COLUMN IF NOT EXISTS partner_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS elite_custom_builds INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS flash_sale_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS matrix_credits NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS chat_settings TEXT NOT NULL DEFAULT '{"sounds":true,"hideTyping":false,"hideReadReceipts":false,"compactMode":false}',
    ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rank VARCHAR(50) NOT NULL DEFAULT 'Junior',
    ADD COLUMN IF NOT EXISTS total_commits INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_stars INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_followers INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_gists INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS github_account_age INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_deployments INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_github_sync TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_username_change_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_key ON users (github_id) WHERE github_id IS NOT NULL AND github_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS users_partner_code_key ON users (partner_code) WHERE partner_code IS NOT NULL AND partner_code <> '';
CREATE INDEX IF NOT EXISTS users_referrer_id_idx ON users (referrer_id);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id BIGINT,
    ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS file_size BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_private_asset BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS changelog JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products (category_id);
CREATE INDEX IF NOT EXISTS products_storage_key_idx ON products (storage_key) WHERE storage_key <> '';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey') THEN
        ALTER TABLE products
            ADD CONSTRAINT products_category_id_fkey
            FOREIGN KEY (category_id) REFERENCES product_categories(id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS add_deployment_service BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deployment_service_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE site_configs
    ADD COLUMN IF NOT EXISTS hero_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS hero_visual_effect VARCHAR(100) NOT NULL DEFAULT 'stack',
    ADD COLUMN IF NOT EXISTS announcements JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS carousel_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS member_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS elite_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS frontend_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS maintenance_message TEXT NOT NULL DEFAULT 'We are currently performing scheduled maintenance. Please check back shortly.';

ALTER TABLE premium_docs
    ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens (expires_at);

CREATE TABLE IF NOT EXISTS github_change_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS github_change_requests_user_id_idx ON github_change_requests (user_id);

CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    category TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS hire_developer_requests (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    reply TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sentiment VARCHAR(50) NOT NULL DEFAULT 'neutral',
    priority INTEGER NOT NULL DEFAULT 1,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    service_intent_id BIGINT REFERENCES service_intents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS hire_developer_requests_user_id_idx ON hire_developer_requests (user_id);
CREATE INDEX IF NOT EXISTS hire_developer_requests_status_idx ON hire_developer_requests (status);

CREATE TABLE IF NOT EXISTS expert_help_requests (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    reply TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sentiment VARCHAR(50) NOT NULL DEFAULT 'neutral',
    priority INTEGER NOT NULL DEFAULT 1,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    expert_intent_id BIGINT REFERENCES expert_intents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS expert_help_requests_user_id_idx ON expert_help_requests (user_id);
CREATE INDEX IF NOT EXISTS expert_help_requests_status_idx ON expert_help_requests (status);

ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS user_handle TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS user_avatar TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS attachment_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_image BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS parent_id BIGINT,
    ADD COLUMN IF NOT EXISTS reply_to_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reply_to_content TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS chat_messages_parent_id_idx ON chat_messages (parent_id);

CREATE TABLE IF NOT EXISTS doc_chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_id BIGINT NOT NULL REFERENCES premium_docs(id) ON DELETE CASCADE,
    history TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS doc_chat_sessions_user_doc_idx ON doc_chat_sessions (user_id, doc_id);

CREATE TABLE IF NOT EXISTS elite_chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL DEFAULT 0,
    title VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    source VARCHAR(30) NOT NULL DEFAULT 'negotiation',
    payment_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS elite_chat_sessions_user_id_idx ON elite_chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS elite_chat_sessions_product_id_idx ON elite_chat_sessions (product_id);

CREATE TABLE IF NOT EXISTS elite_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES elite_chat_sessions(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS elite_chat_messages_session_id_idx ON elite_chat_messages (session_id);
CREATE INDEX IF NOT EXISTS elite_chat_messages_sender_id_idx ON elite_chat_messages (sender_id);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    message TEXT,
    type TEXT,
    target TEXT,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);

ALTER TABLE licenses
    ADD COLUMN IF NOT EXISTS public_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NOT NULL DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS signed_token TEXT,
    ADD COLUMN IF NOT EXISTS issued_token_hash VARCHAR(128),
    ADD COLUMN IF NOT EXISTS max_activations INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS activation_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoke_reason TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS licenses_public_id_key ON licenses (public_id) WHERE public_id IS NOT NULL AND public_id <> '';
CREATE INDEX IF NOT EXISTS licenses_issued_token_hash_idx ON licenses (issued_token_hash);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON licenses (status);

CREATE TABLE IF NOT EXISTS license_activations (
    id BIGSERIAL PRIMARY KEY,
    license_id BIGINT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    fingerprint_type VARCHAR(50) NOT NULL,
    fingerprint_value VARCHAR(512) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    app_version VARCHAR(50),
    ip VARCHAR(100),
    user_agent VARCHAR(512),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS license_activations_license_id_idx ON license_activations (license_id);
CREATE INDEX IF NOT EXISTS license_activations_fingerprint_value_idx ON license_activations (fingerprint_value);

CREATE TABLE IF NOT EXISTS license_events (
    id BIGSERIAL PRIMARY KEY,
    license_id BIGINT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    activation_id BIGINT REFERENCES license_activations(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip VARCHAR(100),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS license_events_license_id_idx ON license_events (license_id);
CREATE INDEX IF NOT EXISTS license_events_activation_id_idx ON license_events (activation_id);
CREATE INDEX IF NOT EXISTS license_events_event_type_idx ON license_events (event_type);

CREATE TABLE IF NOT EXISTS product_license_policies (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    signing_mode VARCHAR(50) NOT NULL DEFAULT 'ed25519',
    allow_offline BOOLEAN NOT NULL DEFAULT TRUE,
    grace_period_days INTEGER NOT NULL DEFAULT 7,
    max_activations_default INTEGER NOT NULL DEFAULT 3,
    require_heartbeat BOOLEAN NOT NULL DEFAULT FALSE,
    heartbeat_hours INTEGER NOT NULL DEFAULT 72,
    update_access_requires BOOLEAN NOT NULL DEFAULT FALSE,
    binding_mode VARCHAR(50) NOT NULL DEFAULT 'domain',
    allow_deactivation BOOLEAN NOT NULL DEFAULT TRUE,
    allow_transfer BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    display_name VARCHAR(255),
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    commission_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
    commission_value NUMERIC(10,2) NOT NULL DEFAULT 10,
    payout_email VARCHAR(255),
    payout_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    total_clicks BIGINT NOT NULL DEFAULT 0,
    total_conversions BIGINT NOT NULL DEFAULT 0,
    total_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
    pending_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliates_status_idx ON affiliates (status);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id BIGSERIAL PRIMARY KEY,
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    referral_code VARCHAR(50),
    landing_url VARCHAR(512),
    visitor_id VARCHAR(255),
    ip VARCHAR(100),
    user_agent VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliate_clicks_affiliate_id_idx ON affiliate_clicks (affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_clicks_referral_code_idx ON affiliate_clicks (referral_code);
CREATE INDEX IF NOT EXISTS affiliate_clicks_visitor_id_idx ON affiliate_clicks (visitor_id);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id BIGSERIAL PRIMARY KEY,
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    commission_amount NUMERIC(10,2) NOT NULL,
    commission_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    conversion_source VARCHAR(100),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliate_conversions_affiliate_id_idx ON affiliate_conversions (affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_order_id_idx ON affiliate_conversions (order_id);
CREATE INDEX IF NOT EXISTS affiliate_conversions_commission_status_idx ON affiliate_conversions (commission_status);

CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
    id BIGSERIAL PRIMARY KEY,
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    method VARCHAR(50),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliate_payout_requests_affiliate_id_idx ON affiliate_payout_requests (affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_payout_requests_status_idx ON affiliate_payout_requests (status);

CREATE TABLE IF NOT EXISTS checkout_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    cart_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    white_glove_selected BOOLEAN NOT NULL DEFAULT FALSE,
    deployment_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    coupon_code VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    recovery_stage INTEGER NOT NULL DEFAULT 0,
    recovered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS checkout_sessions_user_id_idx ON checkout_sessions (user_id);
CREATE INDEX IF NOT EXISTS checkout_sessions_email_idx ON checkout_sessions (email);
CREATE INDEX IF NOT EXISTS checkout_sessions_status_idx ON checkout_sessions (status);
CREATE INDEX IF NOT EXISTS checkout_sessions_order_id_idx ON checkout_sessions (order_id);

CREATE TABLE IF NOT EXISTS cart_recovery_logs (
    id BIGSERIAL PRIMARY KEY,
    checkout_session_id BIGINT NOT NULL REFERENCES checkout_sessions(id) ON DELETE CASCADE,
    email VARCHAR(255),
    recovery_stage INTEGER NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cart_recovery_logs_checkout_session_id_idx ON cart_recovery_logs (checkout_session_id);

CREATE TABLE IF NOT EXISTS import_jobs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_type VARCHAR(20),
    mode VARCHAR(50),
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    created INTEGER NOT NULL DEFAULT 0,
    updated INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS import_jobs_admin_user_id_idx ON import_jobs (admin_user_id);
