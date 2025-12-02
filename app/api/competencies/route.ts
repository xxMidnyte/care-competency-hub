// app/api/competencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Dev-only fallback org_id (for local testing)
// ⚠️ In production this will NOT be used.
const DEV_FALLBACK_ORG_ID = "dc849a4b-afbc-4c27-8074-0cdb4688f7c3";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📥 /api/competencies raw body:", body);

    const {
      title,
      description,
      roles,
      setting,
      risk,
      language,
      sections,
    } = body;

    if (!title || !sections) {
      return NextResponse.json(
        { error: "Missing required fields (title/sections)." },
        { status: 400 }
      );
    }

    // 1) Prefer orgId/org_id from body
    let rawOrgId: string | undefined;
    if (typeof body.orgId === "string") rawOrgId = body.orgId;
    else if (typeof body.org_id === "string") rawOrgId = body.org_id;

    // 2) Dev-only fallback
    if (!rawOrgId) {
      if (process.env.NODE_ENV === "production") {
        console.error("❌ No orgId provided and dev fallback disabled in production.");
        return NextResponse.json(
          {
            error:
              "Missing orgId when saving competency (fallback disabled in production).",
          },
          { status: 400 }
        );
      }

      console.warn(
        "⚠️ Using DEV_FALLBACK_ORG_ID for competency insert. Do NOT use this in production."
      );
      rawOrgId = DEV_FALLBACK_ORG_ID;
    }

    console.log("✅ Using orgId for insert:", rawOrgId);

    const { data, error } = await supabaseAdmin
      .from("competency_templates")
      .insert({
        org_id: rawOrgId,
        title,
        description: description || null,
        roles: roles ?? [],
        setting: setting || null,
        risk: risk || "Medium",
        language: language || "en",
        // 🔑 this matches your NOT NULL "content" column
        content: sections, // JSON/JSONB
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ Insert error:", error);
      return NextResponse.json(
        { error: error.message ?? "Failed to save competency." },
        { status: 500 }
      );
    }

    console.log("✅ Competency saved with id:", data.id);
    return NextResponse.json({ id: data.id }, { status: 200 });
  } catch (err) {
    console.error("❌ Unexpected /api/competencies error:", err);
    return NextResponse.json(
      { error: "Server error saving competency." },
      { status: 500 }
    );
  }
}
