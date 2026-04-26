DROP INDEX IF EXISTS import_jobs_admin_user_id_idx;
DROP TABLE IF EXISTS import_jobs;

DROP INDEX IF EXISTS cart_recovery_logs_checkout_session_id_idx;
DROP TABLE IF EXISTS cart_recovery_logs;

DROP INDEX IF EXISTS checkout_sessions_order_id_idx;
DROP INDEX IF EXISTS checkout_sessions_status_idx;
DROP INDEX IF EXISTS checkout_sessions_email_idx;
DROP INDEX IF EXISTS checkout_sessions_user_id_idx;
DROP TABLE IF EXISTS checkout_sessions;

DROP INDEX IF EXISTS affiliate_payout_requests_status_idx;
DROP INDEX IF EXISTS affiliate_payout_requests_affiliate_id_idx;
DROP TABLE IF EXISTS affiliate_payout_requests;

DROP INDEX IF EXISTS affiliate_conversions_commission_status_idx;
DROP INDEX IF EXISTS affiliate_conversions_order_id_idx;
DROP INDEX IF EXISTS affiliate_conversions_affiliate_id_idx;
DROP TABLE IF EXISTS affiliate_conversions;

DROP INDEX IF EXISTS affiliate_clicks_visitor_id_idx;
DROP INDEX IF EXISTS affiliate_clicks_referral_code_idx;
DROP INDEX IF EXISTS affiliate_clicks_affiliate_id_idx;
DROP TABLE IF EXISTS affiliate_clicks;

DROP INDEX IF EXISTS affiliates_status_idx;
DROP TABLE IF EXISTS affiliates;

DROP TABLE IF EXISTS product_license_policies;

DROP INDEX IF EXISTS license_events_event_type_idx;
DROP INDEX IF EXISTS license_events_activation_id_idx;
DROP INDEX IF EXISTS license_events_license_id_idx;
DROP TABLE IF EXISTS license_events;

DROP INDEX IF EXISTS license_activations_fingerprint_value_idx;
DROP INDEX IF EXISTS license_activations_license_id_idx;
DROP TABLE IF EXISTS license_activations;

DROP INDEX IF EXISTS licenses_status_idx;
DROP INDEX IF EXISTS licenses_issued_token_hash_idx;
DROP INDEX IF EXISTS licenses_public_id_key;

ALTER TABLE licenses
    DROP COLUMN IF EXISTS revoke_reason,
    DROP COLUMN IF EXISTS revoked_at,
    DROP COLUMN IF EXISTS suspended_at,
    DROP COLUMN IF EXISTS last_verified_at,
    DROP COLUMN IF EXISTS metadata,
    DROP COLUMN IF EXISTS activation_count,
    DROP COLUMN IF EXISTS max_activations,
    DROP COLUMN IF EXISTS issued_token_hash,
    DROP COLUMN IF EXISTS signed_token,
    DROP COLUMN IF EXISTS plan,
    DROP COLUMN IF EXISTS customer_email,
    DROP COLUMN IF EXISTS public_id;

DROP INDEX IF EXISTS notifications_user_id_idx;
DROP TABLE IF EXISTS notifications;

DROP INDEX IF EXISTS elite_chat_messages_sender_id_idx;
DROP INDEX IF EXISTS elite_chat_messages_session_id_idx;
DROP TABLE IF EXISTS elite_chat_messages;

DROP INDEX IF EXISTS elite_chat_sessions_product_id_idx;
DROP INDEX IF EXISTS elite_chat_sessions_user_id_idx;
DROP TABLE IF EXISTS elite_chat_sessions;

DROP INDEX IF EXISTS doc_chat_sessions_user_doc_idx;
DROP TABLE IF EXISTS doc_chat_sessions;

DROP INDEX IF EXISTS chat_messages_parent_id_idx;
ALTER TABLE chat_messages
    DROP COLUMN IF EXISTS report_count,
    DROP COLUMN IF EXISTS reply_to_content,
    DROP COLUMN IF EXISTS reply_to_name,
    DROP COLUMN IF EXISTS parent_id,
    DROP COLUMN IF EXISTS is_pinned,
    DROP COLUMN IF EXISTS role,
    DROP COLUMN IF EXISTS is_image,
    DROP COLUMN IF EXISTS attachment_url,
    DROP COLUMN IF EXISTS user_avatar,
    DROP COLUMN IF EXISTS user_handle;

DROP INDEX IF EXISTS expert_help_requests_status_idx;
DROP INDEX IF EXISTS expert_help_requests_user_id_idx;
DROP TABLE IF EXISTS expert_help_requests;

DROP INDEX IF EXISTS hire_developer_requests_status_idx;
DROP INDEX IF EXISTS hire_developer_requests_user_id_idx;
DROP TABLE IF EXISTS hire_developer_requests;

ALTER TABLE posts
    DROP COLUMN IF EXISTS published_at,
    DROP COLUMN IF EXISTS category,
    DROP COLUMN IF EXISTS author_id;

DROP INDEX IF EXISTS github_change_requests_user_id_idx;
DROP TABLE IF EXISTS github_change_requests;

DROP INDEX IF EXISTS refresh_tokens_expires_at_idx;
DROP INDEX IF EXISTS refresh_tokens_user_id_idx;
DROP TABLE IF EXISTS refresh_tokens;

ALTER TABLE premium_docs
    DROP COLUMN IF EXISTS image;

ALTER TABLE site_configs
    DROP COLUMN IF EXISTS maintenance_message,
    DROP COLUMN IF EXISTS maintenance_mode,
    DROP COLUMN IF EXISTS frontend_url,
    DROP COLUMN IF EXISTS elite_settings,
    DROP COLUMN IF EXISTS member_plans,
    DROP COLUMN IF EXISTS carousel_stack,
    DROP COLUMN IF EXISTS announcements,
    DROP COLUMN IF EXISTS hero_visual_effect,
    DROP COLUMN IF EXISTS hero_images;

ALTER TABLE orders
    DROP COLUMN IF EXISTS deployment_service_fee,
    DROP COLUMN IF EXISTS add_deployment_service;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_category_id_fkey,
    DROP COLUMN IF EXISTS changelog,
    DROP COLUMN IF EXISTS is_private_asset,
    DROP COLUMN IF EXISTS mime_type,
    DROP COLUMN IF EXISTS file_size,
    DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS storage_key,
    DROP COLUMN IF EXISTS storage_provider,
    DROP COLUMN IF EXISTS category_id;

DROP INDEX IF EXISTS products_storage_key_idx;
DROP INDEX IF EXISTS products_category_id_idx;

DROP INDEX IF EXISTS users_referrer_id_idx;
DROP INDEX IF EXISTS users_partner_code_key;
DROP INDEX IF EXISTS users_github_id_key;
DROP INDEX IF EXISTS users_username_key;

ALTER TABLE users
    DROP COLUMN IF EXISTS last_username_change_at,
    DROP COLUMN IF EXISTS last_github_sync,
    DROP COLUMN IF EXISTS total_deployments,
    DROP COLUMN IF EXISTS github_account_age,
    DROP COLUMN IF EXISTS total_gists,
    DROP COLUMN IF EXISTS total_followers,
    DROP COLUMN IF EXISTS total_stars,
    DROP COLUMN IF EXISTS total_commits,
    DROP COLUMN IF EXISTS rank,
    DROP COLUMN IF EXISTS xp,
    DROP COLUMN IF EXISTS chat_settings,
    DROP COLUMN IF EXISTS matrix_credits,
    DROP COLUMN IF EXISTS flash_sale_expires_at,
    DROP COLUMN IF EXISTS elite_custom_builds,
    DROP COLUMN IF EXISTS partner_balance,
    DROP COLUMN IF EXISTS referrer_id,
    DROP COLUMN IF EXISTS partner_code,
    DROP COLUMN IF EXISTS twitter,
    DROP COLUMN IF EXISTS github_id,
    DROP COLUMN IF EXISTS github,
    DROP COLUMN IF EXISTS website,
    DROP COLUMN IF EXISTS bio,
    DROP COLUMN IF EXISTS pro_expires_at,
    DROP COLUMN IF EXISTS is_pro,
    DROP COLUMN IF EXISTS avatar_url,
    DROP COLUMN IF EXISTS username;

DROP TABLE IF EXISTS expert_intents;
DROP TABLE IF EXISTS service_intents;
DROP TABLE IF EXISTS product_categories;
