// app/dashboard/tracks/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Track = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
};

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tracks")
        .select("id, title, slug, description")
        .order("created_at", { ascending: true });

      if (!error && data) setTracks(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading tracks…</div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Growth Tracks</h1>
          <p className="text-xs text-slate-400">
            Choose a track to view your competencies and progress.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/dashboard/tracks/${track.id}`}
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-emerald-500/70 hover:bg-slate-900"
          >
            <h2 className="text-sm font-semibold text-slate-50 group-hover:text-emerald-400">
              {track.title}
            </h2>
            {track.description && (
              <p className="mt-2 line-clamp-3 text-xs text-slate-400">
                {track.description}
              </p>
            )}
            <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-500">
              View track →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
