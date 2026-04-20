ALTER TABLE products
    DROP COLUMN IF EXISTS snippet,
    DROP COLUMN IF EXISTS snippet_language,
    DROP COLUMN IF EXISTS preview_images,
    DROP COLUMN IF EXISTS duration,
    DROP COLUMN IF EXISTS course_outline,
    DROP COLUMN IF EXISTS video_url;
