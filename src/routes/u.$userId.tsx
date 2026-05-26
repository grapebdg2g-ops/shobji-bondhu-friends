import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Sprout, BadgeCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContentMenu } from "@/components/krishi/content-menu";
import { EmptyState } from "@/components/krishi/empty-state";

type Profile = {
  id: string;
  name: string;
  district: string | null;
  upazila: string | null;
  avatar_url: string | null;
  bio: string | null;
  crops: string[] | null;
  role: string;
  is_verified: boolean;
  posts_count: number;
  prices_count: number;
  exchanges_count: number;
  created_at: string;
};

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [{ title: "ব্যবহারকারী প্রোফাইল" }],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,name,district,upazila,avatar_url,bio,crops,role,is_verified,posts_count,prices_count,exchanges_count,created_at",
        )
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as Profile);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/feed" })}
            aria-label="ফিরে যান"
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">প্রোফাইল</h1>
          {profile && (
            <ContentMenu
              contentType="user"
              contentId={profile.id}
              authorId={profile.id}
              authorName={profile.name}
            />
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notFound || !profile ? (
        <div className="px-4 pt-10">
          <EmptyState title="ব্যবহারকারী পাওয়া যায়নি" description="এই অ্যাকাউন্ট আর নেই বা মুছে দেওয়া হয়েছে।" />
        </div>
      ) : (
        <section className="px-4 pt-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/15 text-primary flex items-center justify-center overflow-hidden text-3xl font-bold">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.name.charAt(0) || "ক"
              )}
            </div>
            <h2 className="mt-3 text-xl font-bold flex items-center gap-1.5">
              {profile.name || "অজ্ঞাত"}
              {profile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </h2>
            {(profile.district || profile.upazila) && (
              <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.upazila ? `${profile.upazila}, ${profile.district}` : profile.district}
              </p>
            )}
            {profile.bio && (
              <p className="mt-3 text-sm text-foreground/80 max-w-md">{profile.bio}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="পোস্ট" value={profile.posts_count} />
            <Stat label="দাম" value={profile.prices_count} />
            <Stat label="বিনিময়" value={profile.exchanges_count} />
          </div>

          {profile.crops && profile.crops.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Sprout className="h-3.5 w-3.5" /> চাষ করা ফসল
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.crops.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link
            to="/feed"
            className="block text-center text-sm text-muted-foreground underline pt-2"
          >
            ফিডে ফিরে যান
          </Link>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="text-lg font-bold text-foreground">{value ?? 0}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
