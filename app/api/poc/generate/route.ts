// app/api/poc/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateJson } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deficiencyId, orgId, facilityId, customNotes } = body;

    if (!deficiencyId || !orgId) {
      return NextResponse.json(
        { error: "Missing deficiencyId or orgId" },
        { status: 400 }
      );
    }

    // 1) Fetch deficiency
    const { data: deficiency, error: defError } = await supabaseAdmin
      .from("survey_deficiencies")
      .select("*")
      .eq("id", deficiencyId)
      .eq("org_id", orgId)
      .single();

    if (defError || !deficiency) {
      console.error("Deficiency load error:", defError);
      return NextResponse.json(
        { error: "Deficiency not found" },
        { status: 404 }
      );
    }

    // 2) Build AI prompt
    const prompt = `
You are a strict JSON generator and an expert in CMS/state survey compliance, specializing in creating Plans of Correction (POCs) that meet CMS-2567 expectations. Always respond with ONLY valid JSON, no extra text.

You will create a Plan of Correction for the following deficiency.

--- DEFICIENCY CONTEXT ---
Organization ID: ${orgId}
Facility ID: ${facilityId ?? "N/A"}
Tag / Code: ${deficiency.tag_code ?? "Unknown"}
Title: ${deficiency.title ?? "Not provided"}
Severity: ${deficiency.severity ?? "N/A"}
Scope: ${deficiency.scope ?? "N/A"}
Survey Date: ${deficiency.survey_date ?? "N/A"}

Deficiency Text:
${deficiency.deficiency_text}

--- ADDITIONAL NOTES FROM FACILITY ---
${customNotes || "None provided."}

Your Plan of Correction MUST clearly address the following CMS-required elements, in this structure:

1) IMMEDIATE ACTIONS TAKEN
2) HOW THE DEFICIENCY WILL BE CORRECTED FOR ALL RESIDENTS
3) HOW THE FACILITY WILL MONITOR / QUALITY ASSURANCE
4) COMPLETION DATE
5) RESPONSIBLE ROLES / POSITIONS
6) POLICY & EDUCATION UPDATES
7) DOCUMENTATION / PROOF PLAN

Return your answer as a strict JSON object with this exact shape and nothing else (no backticks, no explanation):

{
  "immediate_actions": "string",
  "correction_steps": "string",
  "monitoring_plan": "string",
  "completion_date": "YYYY-MM-DD or reason if unknown",
  "responsible_roles": "string",
  "policy_updates": "string",
  "education_plan": "string",
  "documentation_plan": "string"
}
    `.trim();

    // 3) Call Gemini
    const responseSchema = {
      type: "OBJECT",
      properties: {
        immediate_actions: { type: "STRING" },
        correction_steps: { type: "STRING" },
        monitoring_plan: { type: "STRING" },
        completion_date: { type: "STRING" },
        responsible_roles: { type: "STRING" },
        policy_updates: { type: "STRING" },
        education_plan: { type: "STRING" },
        documentation_plan: { type: "STRING" },
      },
      required: [
        "immediate_actions",
        "correction_steps",
        "monitoring_plan",
        "completion_date",
        "responsible_roles",
        "policy_updates",
        "education_plan",
        "documentation_plan",
      ],
    };

    let parsed: any;
    try {
      parsed = await generateJson(prompt, responseSchema);
    } catch (e) {
      console.error("Gemini POC generation failed:", e);
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    // 4) Save POC to DB
    const { data: poc, error: pocError } = await supabaseAdmin
      .from("survey_pocs")
      .insert({
        org_id: orgId,
        deficiency_id: deficiencyId,
        immediate_actions: parsed.immediate_actions,
        correction_steps: parsed.correction_steps,
        monitoring_plan: parsed.monitoring_plan,
        completion_date:
          parsed.completion_date &&
          /^\d{4}-\d{2}-\d{2}$/.test(parsed.completion_date)
            ? parsed.completion_date
            : null,
        responsible_roles: parsed.responsible_roles,
        policy_updates: parsed.policy_updates,
        education_plan: parsed.education_plan,
        documentation_plan: parsed.documentation_plan,
        ai_raw: parsed,
        generated_by: null, // can wire user.id later if you want
        status: "draft",
      })
      .select("*")
      .single();

    if (pocError || !poc) {
      console.error("POC insert error:", pocError);
      return NextResponse.json(
        { error: "Failed to save generated POC." },
        { status: 500 }
      );
    }

    return NextResponse.json({ poc }, { status: 200 });
  } catch (err) {
    console.error("POC generation error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
