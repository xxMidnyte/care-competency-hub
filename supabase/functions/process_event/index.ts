// supabase/functions/process_event/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProcessEventBody = { event_id: string };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-edge-secret, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, data: unknown, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extraHeaders },
  });
}

function getByPath(obj: any, path: string) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function evalCondition(event: any, cond: any): boolean {
  const op = cond?.op;
  const path = cond?.path;
  const value = cond?.value;
  if (!op || !path) return false;

  const actual = getByPath(event, path);

  switch (op) {
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "in":
      return Array.isArray(value) ? value.includes(actual) : false;
    default:
      return false;
  }
}

function buildFeedFromEvent(ev: any) {
  const t = ev.event_type;
  const p = ev.payload || {};

  if (t === "assignment_created") {
    return {
      feed_type: t,
      message: `${p.staff_name || "A staff member"} was assigned ${p.competency_title || "a competency"}.`,
      href: p.href || (p.assignment_id ? `/dashboard/assignments/${p.assignment_id}` : null),
      meta: { staff_id: p.staff_id ?? null, facility_id: p.facility_id ?? null },
    };
  }

  if (t === "assignment_completed") {
    return {
      feed_type: t,
      message: `${p.staff_name || "A staff member"} completed ${p.competency_title || "a competency"}.`,
      href: p.href || (p.assignment_id ? `/dashboard/assignments/${p.assignment_id}` : null),
      meta: { staff_id: p.staff_id ?? null, facility_id: p.facility_id ?? null },
    };
  }

  if (t === "assignment_overdue") {
    return {
      feed_type: t,
      message: `${p.staff_name || "A staff member"} is overdue for ${p.competency_title || "a competency"}.`,
      href: p.href || (p.assignment_id ? `/dashboard/assignments/${p.assignment_id}` : null),
      meta: { staff_id: p.staff_id ?? null, facility_id: p.facility_id ?? null },
    };
  }

  if (t === "policy_published") {
    return {
      feed_type: t,
      message: `${p.policy_title || "A policy"} was published.`,
      href: p.href || (p.policy_id ? `/dashboard/policies/${p.policy_id}` : null),
      meta: { facility_id: p.facility_id ?? null },
    };
  }

  if (t === "deficiency_created") {
    return {
      feed_type: t,
      message: `${p.title || "A deficiency"} was added.`,
      href: p.href || (p.deficiency_id ? `/dashboard/deficiencies/${p.deficiency_id}` : null),
      meta: { facility_id: p.facility_id ?? null },
    };
  }

  return null;
}

async function getManagers(supabase: any, org_id: string) {
  const { data, error } = await supabase
    .from("staff_members")
    .select("auth_user_id")
    .eq("org_id", org_id)
    .eq("is_manager", true)
    .not("auth_user_id", "is", null);

  if (error) return [];
  return (data || []).map((r: any) => r.auth_user_id).filter(Boolean);
}

async function insertNotifications(
  supabase: any,
  rows: Array<{ org_id: string; user_id: string; title: string; body: string; severity?: string; href?: string | null; meta?: any }>
) {
  if (!rows.length) return;
  await supabase.from("notifications").insert(
    rows.map((r) => ({
      org_id: r.org_id,
      user_id: r.user_id,
      title: r.title,
      body: r.body,
      severity: r.severity || "info",
      href: r.href ?? null,
      meta: r.meta ?? {},
    }))
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed", method: req.method });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const EDGE_SECRET = Deno.env.get("EDGE_FUNCTION_SECRET") || "";

  // Secret-gate
  if (EDGE_SECRET) {
    const provided = req.headers.get("x-edge-secret") || "";
    if (provided !== EDGE_SECRET) return json(401, { error: "Unauthorized" });
  }

  const body = (await req.json().catch(() => null)) as ProcessEventBody | null;
  if (!body?.event_id) return json(400, { error: "event_id is required" });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: ev, error: evErr } = await supabase
    .from("org_events")
    .select("*")
    .eq("id", body.event_id)
    .single();

  if (evErr || !ev) return json(404, { error: "Event not found", detail: evErr });

  const org_id = ev.org_id;
  const p = ev.payload || {};

  // Feed
  const feed = buildFeedFromEvent(ev);
  if (feed) {
    await supabase.from("activity_feed").insert({
      org_id,
      actor_user_id: ev.actor_user_id,
      event_id: ev.id,
      feed_type: feed.feed_type,
      message: feed.message,
      href: feed.href ?? null,
      meta: feed.meta ?? {},
    });
  }

  // Baseline notifications
  const notifs: any[] = [];

  if (ev.event_type === "assignment_created" && p.staff_user_id) {
    notifs.push({
      org_id,
      user_id: p.staff_user_id,
      title: "New assignment",
      body: p.competency_title ? `You were assigned: ${p.competency_title}` : "You received a new assignment.",
      severity: "info",
      href: p.href || (p.assignment_id ? `/dashboard/assignments/${p.assignment_id}` : null),
      meta: { staff_id: p.staff_id ?? null, facility_id: p.facility_id ?? null },
    });
  }

  if (ev.event_type === "assignment_overdue" && p.staff_user_id) {
    notifs.push({
      org_id,
      user_id: p.staff_user_id,
      title: "Overdue assignment",
      body: p.competency_title ? `Overdue: ${p.competency_title}` : "You have an overdue assignment.",
      severity: "warning",
      href: p.href || (p.assignment_id ? `/dashboard/assignments/${p.assignment_id}` : null),
      meta: { staff_id: p.staff_id ?? null, facility_id: p.facility_id ?? null },
    });

    const managers = await getManagers(supabase, org_id);
    for (const uid of managers) {
      notifs.push({
        org_id,
        user_id: uid,
        title: "Staff overdue",
        body:
          p.staff_name && p.competency_title
            ? `${p.staff_name} is overdue for ${p.competency_title}.`
            : "A staff member has an overdue assignment.",
        severity: "warning",
        href: p.href || (p.assignment_id ? `/dashboard/assignments/${p.assignment_id}` : null),
        meta: { staff_id: p.staff_id ?? null, facility_id: p.facility_id ?? null },
      });
    }
  }

  await insertNotifications(supabase, notifs);

  // Automations
  const { data: autos, error: autoErr } = await supabase
    .from("automations")
    .select("*")
    .eq("org_id", org_id)
    .eq("enabled", true)
    .eq("trigger_event", ev.event_type);

  if (autoErr) return json(500, { error: "Failed to load automations", detail: autoErr });

  const processed: any[] = [];

  for (const a of autos || []) {
    // idempotency
    const { error: runErr } = await supabase.from("automation_runs").insert({
      org_id,
      automation_id: a.id,
      event_id: ev.id,
      status: "success",
    });

    if (runErr) {
      processed.push({ automation_id: a.id, skipped: true, reason: "already_processed" });
      continue;
    }

    try {
      const conditions = Array.isArray(a.conditions) ? a.conditions : [];
      const actions = Array.isArray(a.actions) ? a.actions : [];
      const pass = conditions.every((c: any) => evalCondition(ev, c));

      if (!pass) {
        processed.push({ automation_id: a.id, ran: false, reason: "conditions_not_met" });
        continue;
      }

      for (const act of actions) {
        const type = act?.type;

        if (type === "notify_user") {
          const toPath = act?.to;
          const toUser = typeof toPath === "string" ? getByPath(ev, toPath) : null;
          if (!toUser) continue;

          await insertNotifications(supabase, [
            {
              org_id,
              user_id: toUser,
              title: act?.title || "Notification",
              body: act?.body || "",
              severity: act?.severity || "info",
              href: act?.href || null,
              meta: act?.meta || {},
            },
          ]);
        }

        if (type === "notify_managers") {
          const managers = await getManagers(supabase, org_id);
          await insertNotifications(
            supabase,
            managers.map((uid) => ({
              org_id,
              user_id: uid,
              title: act?.title || "Notification",
              body: act?.body || "",
              severity: act?.severity || "info",
              href: act?.href || null,
              meta: act?.meta || {},
            }))
          );
        }

        if (type === "create_assignment") {
          const staffId =
            act?.staff_id ??
            (typeof act?.staff_id_path === "string" ? getByPath(ev, act.staff_id_path) : null);

          const facilityId =
            act?.facility_id ??
            (typeof act?.facility_id_path === "string" ? getByPath(ev, act.facility_id_path) : null);

          const competencyId = act?.competency_id;
          if (!staffId || !competencyId) continue;

          await supabase.from("assignments").insert({
            org_id,
            staff_id: staffId,
            facility_id: facilityId ?? null,
            competency_id: competencyId,
            status: "assigned",
            due_date: act?.due_date ?? null,
          });
        }
      }

      processed.push({ automation_id: a.id, ran: true });
    } catch (e: any) {
      await supabase
        .from("automation_runs")
        .update({ status: "failed", error: e?.message || String(e) })
        .eq("automation_id", a.id)
        .eq("event_id", ev.id);

      processed.push({ automation_id: a.id, ran: false, error: e?.message || String(e) });
    }
  }

  return json(200, { ok: true, event_id: ev.id, feed_created: !!feed, automations: processed });
});
