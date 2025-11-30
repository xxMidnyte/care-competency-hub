import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

type ParamsPromise = Promise<{ facilityId: string; competencyId: string }>;

export async function GET(
  _req: NextRequest,
  context: { params: ParamsPromise }
) {
  const { facilityId, competencyId } = await context.params;

  // basic UUID sanity check
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  if (!uuidRegex.test(facilityId) || !uuidRegex.test(competencyId)) {
    return NextResponse.json(
      { error: "Invalid facilityId or competencyId" },
      { status: 400 }
    );
  }

  // Get overdue staff for this competency in this facility
  const { data, error } = await supabase
    .from("staff_competencies")
    .select(
      `
      id,
      status,
      due_at,
      completed_at,
      staff:staff_members (
        id,
        full_name,
        role_title
      )
    `
    )
    .eq("facility_id", facilityId)
    .eq("competency_id", competencyId)
    .eq("status", "overdue")
    .order("due_at", { ascending: true });

  if (error) {
    console.error("Overdue staff error:", error);
    return NextResponse.json(
      { error: "Failed to load overdue staff" },
      { status: 500 }
    );
  }

  const now = new Date();

  const normalized =
    (data ?? []).map((row: any) => {
      const due = row.due_at ? new Date(row.due_at) : null;
      let days_overdue: number | null = null;

      if (due) {
        const diffMs = now.getTime() - due.getTime();
        days_overdue = Math.max(
          0,
          Math.floor(diffMs / (1000 * 60 * 60 * 24))
        );
      }

      return {
        staff_id: row.staff?.id ?? null,
        full_name: row.staff?.full_name ?? "Unknown staff",
        role_title: row.staff?.role_title ?? null,
        due_at: row.due_at,
        days_overdue,
      };
    }) ?? [];

  return NextResponse.json(normalized, { status: 200 });
}
