import { supabase } from "@/lib/supabaseClient";

export async function POST(_: Request, { params }: any) {
  const drillId = params.id;

  const { error } = await supabase
    .from("drills")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", drillId);

  if (error) return Response.json({ error }, { status: 400 });

  return Response.json({ success: true });
}
