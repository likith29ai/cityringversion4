import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getGroupsForAI() {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      title,
      city,
      interest,
      description,
      platforms
    `)
    .limit(20);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}