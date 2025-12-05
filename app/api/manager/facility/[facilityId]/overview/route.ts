// app/api/manager/facility/[facilityId]/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

type ParamsPromise = Promise<{ facilityId: string }>;

export async function GET(
  _req: NextRequest,
  ctx: { params: ParamsPromise }
) {
  const { facilityId } = await ctx.params;

  // basic UUID sanity check
  if (!/^[0-9a-fA-F-]{36}$/.test(facilityId)) {
    return NextResponse.json(
      { error: "Invalid facilityId" },
      { status: 400 }
    );
  }

  // 1) overall snapshot
  const { data: snapshot, error: snapErr } = await supabase
    .from("facility_dashboard_snapshot")
    .select("*")
    .eq("facility_id", facilityId)
    .maybeSingle();

  if (snapErr) {
    console.error("Manager snapshot error", snapErr);
    return NextResponse.json(
      { error: "Failed to load snapshot" },
      { status: 500 }
    );
  }

  // 2) staff compliance summary
  const { data: staffRows, error: staffErr } = await supabase
    .from("staff_compliance_summary")
    .select("*")
    .eq("facility_id", facilityId);

  if (staffErr) {
    console.error("Manager staff summary error", staffErr);
    return NextResponse.json(
      { error: "Failed to load staff" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      snapshot,
      staff: staffRows,
    },
    { status: 200 }
  );
}
