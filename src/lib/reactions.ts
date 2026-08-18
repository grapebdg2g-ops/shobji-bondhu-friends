export const REACTION_TYPES = ["like", "love", "care", "haha", "wow", "sad", "angry"] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_META: Record<ReactionType, { emoji: string; label: string; className: string }> = {
  like: { emoji: "👍", label: "পছন্দ", className: "text-blue-600" },
  love: { emoji: "❤️", label: "ভালোবাসা", className: "text-rose-600" },
  care: { emoji: "🤗", label: "যত্ন", className: "text-amber-600" },
  haha: { emoji: "😂", label: "হাহা", className: "text-yellow-600" },
  wow: { emoji: "😮", label: "বাহ", className: "text-orange-600" },
  sad: { emoji: "😢", label: "দুঃখ", className: "text-sky-600" },
  angry: { emoji: "😡", label: "রাগ", className: "text-red-600" },
};
