import { BottomSheet } from "@/components/krishi/bottom-sheet";
import { useMutedList, useMuteMutation } from "@/hooks/use-muted-users";
import { BellOff, Loader2 } from "lucide-react";
import { LazyImage } from "@/components/krishi/lazy-image";

export function MutedUsersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: list, isLoading } = useMutedList();
  const { unmute } = useMuteMutation();

  return (
    <BottomSheet open={open} onClose={onClose} title="মিউট করা ব্যবহারকারীরা">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !list || list.length === 0 ? (
        <div className="text-center py-8">
          <BellOff className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">আপনি কাউকে মিউট করেননি</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
          {list.map((row: any) => {
            const p = row.profile;
            const name = p?.name || "অজ্ঞাত ব্যবহারকারী";
            return (
              <li
                key={row.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {p?.avatar_url ? (
                    <LazyImage src={p.avatar_url} alt={name} wrapperClassName="h-full w-full rounded-full" />
                  ) : (
                    <span>{name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{name}</p>
                  {p?.district && <p className="text-[11px] text-muted-foreground truncate">{p.district}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => unmute.mutate(row.muted_id)}
                  disabled={unmute.isPending}
                  className="h-9 px-3 rounded-lg bg-primary/10 text-primary text-xs font-bold active:scale-95 disabled:opacity-50"
                >
                  আনমিউট
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
