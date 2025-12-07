// app/api/dashboard/facility/[facilityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Tiny UUID validator
function isUuid(value: string | undefined): value is string {
  return !!value && /^[0-9a-fA-F-]{36}$/.test(value);
}

/**
 * GET /api/dashboard/facility/[facilityId]
 * Returns facility info + staff list (you can expand with more stats later).
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId } = await context.params;

  if (!isUuid(facilityId)) {
    return NextResponse.json(
      { error: "Invalid facilityId" },
      { status: 400 }
    );
  }

  // 1) Facility row
  const { data: facility, error: facilityErr } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", facilityId)
    .single();

  if (facilityErr) {
    console.error(
      "GET /api/dashboard/facility/[facilityId] facility error:",
      facilityErr
    );
    return NextResponse.json(
      { error: "Failed to load facility" },
      { status: 500 }
    );
  }

  // 2) Staff at this facility (lightweight fields)
  const { data: staff, error: staffErr } = await supabase
    .from("staff_members")
    .select("id, full_name, email, org_id, facility_id")
    .eq("facility_id", facilityId);

  if (staffErr) {
    console.error(
      "GET /api/dashboard/facility/[facilityId] staff error:",
      staffErr
    );
    return NextResponse.json(
      { error: "Failed to load facility staff" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      facility,
      staff: staff ?? [],
    },
    { status: 200 }
  );
}
