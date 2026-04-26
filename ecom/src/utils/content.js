/**
 * Strips HTML tags from a string and returns plain text.
 */
export const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

/**
 * Calculates estimated reading time for a given text or HTML content.
 * Average reading speed: 200 words per minute.
 */
export const calculateReadingTime = (content) => {
    const text = stripHtml(content);
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
};
