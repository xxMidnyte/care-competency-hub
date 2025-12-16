// supabase/functions/emit_event/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type EmitEventBody = {
  org_id: string;
  actor_user_id?: string | null;

  event_type: string;
  entity_type?: string | null;
  entity_id?: string | null;

  payload?: Record<string, unknown>;
  process_now?: boolean; // default true
};

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

function safeJsonMaybe(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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

  const body = (await req.json().catch(() => null)) as EmitEventBody | null;
  if (!body) return json(400, { error: "Invalid JSON body" });

  const org_id = (body.org_id || "").trim();
  const event_type = (body.event_type || "").trim();
  if (!org_id) return json(400, { error: "org_id is required" });
  if (!event_type) return json(400, { error: "event_type is required" });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: ev, error } = await supabase
    .from("org_events")
    .insert({
      org_id,
      actor_user_id: body.actor_user_id ?? null,
      event_type,
      entity_type: body.entity_type ?? null,
      entity_id: body.entity_id ?? null,
      payload: body.payload ?? {},
    })
    .select("*")
    .single();

  if (error || !ev) return json(500, { error: "Failed to insert event", detail: error });

  const processNow = body.process_now ?? true;
  if (!processNow) return json(200, { ok: true, event: ev, processed: false, skipped: "process_now=false" });

  // IMPORTANT: call via SUPABASE_URL (always https) not req.url origin
  const target = `${SUPABASE_URL}/functions/v1/process_event`;
  console.log("emit_event -> calling", { method: "POST", target });

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(EDGE_SECRET ? { "x-edge-secret": EDGE_SECRET } : {}),
      },
      body: JSON.stringify({ event_id: ev.id }),
    });

    const processStatus = res.status;
    const processText = await res.text().catch(() => "");

    if (!res.ok) {
      return json(202, {
        ok: true,
        event: ev,
        processed: false,
        process_error: { status: processStatus, body: processText || null },
        debug: { target },
      });
    }

    return json(200, {
      ok: true,
      event: ev,
      processed: true,
      debug: { target },
      process_response: processText ? safeJsonMaybe(processText) : null,
    });
  } catch (e: any) {
    return json(202, {
      ok: true,
      event: ev,
      processed: false,
      process_error: { message: e?.message || String(e) },
      debug: { target },
    });
  }
});
