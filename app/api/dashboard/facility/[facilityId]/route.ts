// app/api/dashboard/facility/[facilityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Helper: tiny validator to avoid obviously bad IDs
function isUuid(value: string | undefined): value is string {
  return !!value && /^[0-9a-fA-F-]{36}$/.test(value);
}

/**
 * GET /api/dashboard/facility/[facilityId]
 * Returns a facility + related data for the manager dashboard.
 *
 * Adjust table names/fields if yours differ:
 * - "facilities"
 * - "staff_members"
 * - "competency_assignments"
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId } = await params;

  if (!isUuid(facilityId)) {
    return NextResponse.json(
      { error: "Invalid facilityId" },
      { status: 400 }
    );
  }

  // Fetch facility, staff, and assignments in parallel
  const [
    { data: facility, error: facilityError },
    { data: staff, error: staffError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase
      .from("facilities")
      .select("*")
      .eq("id", facilityId)
      .single(),

    supabase
      .from("staff_members")
      .select("*")
      .eq("facility_id", facilityId),

    supabase
      .from("competency_assignments")
      .select("*")
      .eq("facility_id", facilityId),
  ]);

  if (facilityError) {
    console.error(
      "GET /api/dashboard/facility/[facilityId] facility error:",
      facilityError
    );
    return NextResponse.json(
      { error: "Failed to load facility" },
      { status: 500 }
    );
  }

  if (staffError) {
    console.error(
      "GET /api/dashboard/facility/[facilityId] staff error:",
      staffError
    );
    return NextResponse.json(
      { error: "Failed to load facility staff" },
      { status: 500 }
    );
  }

  if (assignmentsError) {
    console.error(
      "GET /api/dashboard/facility/[facilityId] assignments error:",
      assignmentsError
    );
    return NextResponse.json(
      { error: "Failed to load facility assignments" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      facility,
      staff: staff ?? [],
      assignments: assignments ?? [],
    },
    { status: 200 }
  );
}
