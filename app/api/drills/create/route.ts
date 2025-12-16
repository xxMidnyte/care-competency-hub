import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();

  const { org_id, facility_id, drill_type, stations } = body;

  const { data: drill, error } = await supabase
    .from("drills")
    .insert({
      org_id,
      facility_id,
      drill_type,
    })
    .select()
    .single();

  if (error) return Response.json({ error }, { status: 400 });

  // Insert stations
  const stationRows = stations.map((name: string, index: number) => ({
    drill_id: drill.id,
    name,
    order_index: index,
  }));

  await supabase.from("drill_stations").insert(stationRows);

  return Response.json({ drill });
}
