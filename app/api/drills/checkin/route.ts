// app/api/drills/checkin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/drills/checkin
 * Body: { station_id: string, name: string, role?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { station_id, name, role } = body as {
      station_id?: string;
      name?: string;
      role?: string;
    };

    if (!station_id || !name) {
      return NextResponse.json(
        { error: "Missing station_id or name." },
        { status: 400 }
      );
    }

    // 1) Look up station → get drill_id
    const { data: station, error: stationError } = await supabase
      .from("drill_stations")
      .select("id, drill_id")
      .eq("id", station_id)
      .single();

    if (stationError || !station) {
      console.error("Check-in: station lookup error:", stationError);
      return NextResponse.json(
        { error: "Invalid station." },
        { status: 400 }
      );
    }

    // 2) Insert check-in
    const { data, error: insertError } = await supabase
      .from("drill_checkins")
      .insert({
        drill_id: station.drill_id,
        station_id: station.id,
        name,
        role: role ?? null,
        staff_id: null, // MVP: anonymous name entry
      })
      .select("id, drill_id, station_id, name, role, timestamp")
      .single();

    if (insertError || !data) {
      console.error("Check-in insert error:", insertError);
      return NextResponse.json(
        { error: "Unable to record check-in." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, checkin: data });
  } catch (err) {
    console.error("Check-in route exception:", err);
    return NextResponse.json(
      { error: "Unexpected error." },
      { status: 500 }
    );
  }
}
