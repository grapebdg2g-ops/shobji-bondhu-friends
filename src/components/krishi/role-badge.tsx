import type { AppRole } from "@/hooks/use-role";

type Props = {
  role: AppRole;
  verified?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const STYLES: Record<Exclude<AppRole, "farmer">, { label: string; cls: string }> = {
  expert: {
    label: "✅ বিশেষজ্ঞ",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  moderator: {
    label: "🛡️ মডারেটর",
    cls: "bg-sky-100 text-sky-700 border-sky-300",
  },
  admin: {
    label: "⚙️ প্রশাসক",
    cls: "bg-purple-100 text-purple-700 border-purple-300",
  },
};

export function RoleBadge({ role, verified, size = "sm", className = "" }: Props) {
  if (role === "farmer") return null;
  // Show expert badge only when verified by an admin
  if (role === "expert" && verified === false) return null;
  const s = STYLES[role];
  const dims = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center font-bold rounded-md border ${s.cls} ${dims} ${className}`}
    >
      {s.label}
    </span>
  );
}
