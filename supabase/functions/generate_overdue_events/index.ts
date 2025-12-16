// supabase/functions/generate_overdue_events/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function originFromReq(req: Request) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const EDGE_SECRET = Deno.env.get("EDGE_FUNCTION_SECRET") || "";

  if (EDGE_SECRET) {
    const provided = req.headers.get("x-edge-secret") || "";
    if (provided !== EDGE_SECRET) return json(401, { error: "Unauthorized" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const base = originFromReq(req);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1) Load overdue assignments (keep select minimal to avoid schema surprises)
  const { data: assignments, error: aErr } = await supabase
    .from("assignments")
    .select("id, org_id, facility_id, staff_id, due_date, status")
    .not("due_date", "is", null)
    .lt("due_date", today)
    .neq("status", "completed");

  if (aErr) return json(500, { error: "Failed to load overdue assignments", detail: aErr });

  if (!assignments?.length) return json(200, { ok: true, overdue_found: 0, emitted: 0 });

  // 2) Fetch staff member info for all staff_ids (so we can include staff_user_id + name)
  const staffIds = Array.from(new Set(assignments.map((a: any) => a.staff_id).filter(Boolean)));

  const { data: staffRows, error: sErr } = await supabase
    .from("staff_members")
    .select("id, full_name, auth_user_id")
    .in("id", staffIds);

  if (sErr) return json(500, { error: "Failed to load staff members", detail: sErr });

  const staffMap = new Map<string, { full_name: string | null; auth_user_id: string | null }>();
  for (const s of staffRows || []) staffMap.set(s.id, { full_name: s.full_name ?? null, auth_user_id: s.auth_user_id ?? null });

  let emitted = 0;
  let processed = 0;

  for (const a of assignments || []) {
    const staff = staffMap.get(a.staff_id) || { full_name: null, auth_user_id: null };

    const res = await fetch(`${base}/functions/v1/emit_event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(EDGE_SECRET ? { "x-edge-secret": EDGE_SECRET } : {}),
      },
      body: JSON.stringify({
        org_id: a.org_id,
        actor_user_id: null,
        event_type: "assignment_overdue",
        entity_type: "assignment",
        entity_id: a.id,
        payload: {
          assignment_id: a.id,
          staff_id: a.staff_id,
          staff_user_id: staff.auth_user_id,
          staff_name: staff.full_name,
          facility_id: a.facility_id,
          due_date: a.due_date,
          href: `/dashboard/assignments/${a.id}`,
        },
        process_now: true,
      }),
    });

    if (res.ok) {
      emitted++;
      const payload = await res.json().catch(() => null);
      if (payload?.processed) processed++;
    }
  }

  return json(200, { ok: true, overdue_found: assignments.length, emitted, processed });
});
