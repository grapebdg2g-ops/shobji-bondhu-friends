import DOMPurify from "dompurify";

/**
 * Strips all HTML tags and trims whitespace.
 * Use on every user-supplied string before persisting to the database.
 */
export const sanitize = (input: string): string => {
  if (typeof input !== "string") return "";
  // DOMPurify with empty ALLOWED_TAGS returns text-only content.
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export const sanitizeOptional = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const out = sanitize(input);
  return out.length ? out : null;
};
