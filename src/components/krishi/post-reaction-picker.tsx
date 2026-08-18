import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { REACTION_META, REACTION_TYPES, type ReactionType } from "@/lib/reactions";

export function PostReactionPicker({
  value,
  onChange,
}: {
  value: ReactionType | null;
  onChange: (reaction: ReactionType | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value ? REACTION_META[value] : REACTION_META.like;

  return (
    <div className="relative min-w-0">
      {open && (
        <div
          role="menu"
          aria-label="প্রতিক্রিয়া বাছুন"
          className="absolute bottom-[calc(100%+8px)] left-0 z-30 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-lift)]"
        >
          {REACTION_TYPES.map((reaction) => {
            const meta = REACTION_META[reaction];
            return (
              <button
                key={reaction}
                type="button"
                role="menuitem"
                title={meta.label}
                aria-label={`${meta.label} reaction দিন`}
                onClick={() => { onChange(value === reaction ? null : reaction); setOpen(false); }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:-translate-y-1 hover:scale-125 ${value === reaction ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"}`}
              >
                <span aria-hidden="true">{meta.emoji}</span>
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={value ? `${active.label} reaction পরিবর্তন করুন` : "প্রতিক্রিয়া দিন"}
        onClick={() => setOpen((current) => !current)}
        className={`home-pressable flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold ${value ? active.className : "text-muted-foreground"}`}
      >
        <span className="text-base leading-none" aria-hidden="true">{value ? active.emoji : "👍"}</span>
        <span className="hidden min-[360px]:inline">{value ? active.label : "প্রতিক্রিয়া"}</span>
        <ChevronDown className="hidden h-3 w-3 min-[360px]:inline" />
      </button>
    </div>
  );
}
