"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Group = {
  id: string;
  title: string;
  city: string;
  interest: string;
  description: string;
  platforms: string[];
  poster_url?: string | null;
};

export default function RingDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      setGroup((data as any) || null);
    }

    load();
  }, [id]);

  if (!group) return null;

  return (
    <main className="min-h-screen text-white">

      {/* SAME BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>
       


      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        <a href="/join" className="text-sm text-white/70 hover:text-white">
          ← Back to Join
        </a>


        <h1 className="mt-6 text-4xl font-semibold">
          {group.title}
        </h1>


        {/* SAME PREMIUM CARD */}
        <div className="mt-10 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">


          {/* POSTER — NO EXTRA SPACE */}
          {group.poster_url && (

            <div className="flex justify-center">

              <img
                src={group.poster_url}
                alt={group.title}
                className="max-w-md w-full h-auto object-contain"
                loading="lazy"
              />

            </div>

          )}



          <div className="p-6">

            {/* DESCRIPTION MOVED HERE - BELOW POSTER */}
            <p className="text-white/70">
              {group.description}
            </p>


            <h2 className="mt-8 text-xl font-semibold">
              About this ring
            </h2>


            <div className="mt-6 grid grid-cols-2 gap-4">

              <InfoCard title="Interest" value={group.interest} />

              <InfoCard title="City" value={group.city} />

            </div>


            <div className="mt-8 max-w-sm">

              <button
                onClick={() => (window.location.href = `/ring/${group.id}/join`)}
                className="w-full px-4 sm:px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500"
              >
                Join Now
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}


function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-2 font-semibold">{value}</div>
    </div>
  );
}