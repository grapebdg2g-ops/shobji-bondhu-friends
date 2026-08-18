export const SAVED_POSTS_KEY = "krishibondhu_saved_posts";

export function readSavedPostIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(SAVED_POSTS_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeSavedPostIds(ids: string[]) {
  try {
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(ids.slice(0, 100)));
  } catch {
    // Ignore private-mode storage failures.
  }
}
