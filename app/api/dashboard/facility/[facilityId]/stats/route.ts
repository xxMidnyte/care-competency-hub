import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  // Manually parse the facilityId from the URL:
  // /api/dashboard/facility/<facilityId>/stats
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean); // remove empty segments

  const facilityIndex = segments.indexOf("facility");
  const facilityId =
    facilityIndex !== -1 && segments.length > facilityIndex + 1
      ? segments[facilityIndex + 1]
      : null;

  console.log("Parsed segments:", segments);
  console.log("Resolved facilityId from URL:", facilityId);

  if (!facilityId) {
    return NextResponse.json(
      { error: "Could not resolve facilityId from URL" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("facility_assignment_stats")
    .select("*")
    .eq("facility_id", facilityId)
    .single();

  if (error) {
    console.error("Supabase facility_assignment_stats error:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json(data);
}
