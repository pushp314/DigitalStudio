DROP INDEX IF EXISTS licenses_order_id_idx;
DROP INDEX IF EXISTS order_items_order_product_idx;
DROP INDEX IF EXISTS orders_payment_status_idx;
DROP INDEX IF EXISTS orders_user_created_at_idx;
DROP INDEX IF EXISTS orders_razorpay_payment_id_key;
DROP INDEX IF EXISTS orders_razorpay_order_id_key;

ALTER TABLE orders
    DROP COLUMN IF EXISTS partner_reward_amount,
    DROP COLUMN IF EXISTS partner_reward_settled,
    DROP COLUMN IF EXISTS settlement_source,
    DROP COLUMN IF EXISTS payment_captured_at,
    DROP COLUMN IF EXISTS settled_at,
    DROP COLUMN IF EXISTS coupon_reserved,
    DROP COLUMN IF EXISTS coupon_code,
    DROP COLUMN IF EXISTS coupon_id,
    DROP COLUMN IF EXISTS currency,
    DROP COLUMN IF EXISTS discount_amount,
    DROP COLUMN IF EXISTS subtotal_price;

DROP INDEX IF EXISTS audit_logs_resource_idx;
DROP INDEX IF EXISTS audit_logs_event_type_idx;
DROP INDEX IF EXISTS audit_logs_request_id_idx;
DROP TABLE IF EXISTS audit_logs;

DROP INDEX IF EXISTS chat_messages_user_id_created_at_idx;
DROP TABLE IF EXISTS chat_messages;

DROP INDEX IF EXISTS contact_inquiries_status_idx;
DROP INDEX IF EXISTS contact_inquiries_user_id_idx;
DROP TABLE IF EXISTS contact_inquiries;

DROP INDEX IF EXISTS coupons_active_code_idx;
DROP TABLE IF EXISTS coupons;
