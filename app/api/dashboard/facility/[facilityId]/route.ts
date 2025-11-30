import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ facilityId: string }> }
) {
  // 🔑 In Next 16, params is a Promise – unwrap it
  const { facilityId } = await context.params;

  // basic UUID sanity check
  if (!facilityId || !/^[0-9a-fA-F-]{36}$/.test(facilityId)) {
    return NextResponse.json(
      { error: "Invalid facilityId" },
      { status: 400 }
    );
  }

  // 1) Facility snapshot (overall compliance / overdue / expiring soon)
  const { data: snapshot, error: snapshotError } = await supabase
    .from("facility_dashboard_snapshot")
    .select("*")
    .eq("facility_id", facilityId)
    .single();

  if (snapshotError && snapshotError.code !== "PGRST116") {
    // PGRST116 = no rows found
    console.error("Snapshot error:", snapshotError);
    return NextResponse.json(
      { error: "Failed to load facility snapshot" },
      { status: 500 }
    );
  }

  // 2) High-risk competencies (top 5)
  const { data: highRisk, error: highRiskError } = await supabase
    .from("facility_high_risk_competencies")
    .select(
      "competency_id, competency_name, risk_level, staff_overdue, overdue_items"
    )
    .eq("facility_id", facilityId)
    .order("risk_level", { ascending: false })
    .order("staff_overdue", { ascending: false })
    .limit(5);

  if (highRiskError) {
    console.error("High-risk error:", highRiskError);
    return NextResponse.json(
      { error: "Failed to load high-risk competencies" },
      { status: 500 }
    );
  }

  // Shape the response a bit for the frontend
  const payload = {
    facilityId,
    snapshot: snapshot || null,
    highRiskCompetencies: highRisk ?? [],
  };

  return NextResponse.json(payload, { status: 200 });
}
