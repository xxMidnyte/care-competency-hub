// app/api/competencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[/api/competencies] Missing Supabase env vars. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

type SectionsPayload = {
  [key: string]: string | null;
};

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      roles,
      setting,
      risk,
      language,
      sections,
      orgId,
      createdBy,
    } = body as {
      title: string;
      description?: string;
      roles: string[];
      setting?: string | null;
      risk?: string;
      language?: string;
      sections: SectionsPayload;
      orgId?: string | null;
      createdBy?: string | null;
    };

    // --------- Basic validation ---------
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: "At least one role is required." },
        { status: 400 }
      );
    }

    if (!sections || typeof sections !== "object") {
      return NextResponse.json(
        { error: "Sections payload is required." },
        { status: 400 }
      );
    }

    // --------- Insert into competencies ---------
    const { data: competency, error: insertError } = await supabase
      .from("competencies")
      .insert({
        org_id: orgId ?? null,
        title: title.trim(),
        description: description ?? null,
        risk: risk ?? null,
        roles,
        setting: setting ?? null,
        language: language ?? null,
        created_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (insertError || !competency) {
      console.error("[/api/competencies] Insert competency error:", insertError);
      return NextResponse.json(
        { error: "Failed to save competency (insert error)." },
        { status: 500 }
      );
    }

    const competencyId = competency.id as string;

    // --------- Insert sections ---------
    const sectionRows = Object.entries(sections)
      .filter(([, value]) => value && String(value).trim().length > 0)
      .map(([key, value]) => ({
        competency_id: competencyId,
        section_key: key,
        content: String(value),
      }));

    if (sectionRows.length > 0) {
      const { error: sectionsError } = await supabase
        .from("competency_sections")
        .insert(sectionRows);

      if (sectionsError) {
        console.error(
          "[/api/competencies] Insert sections error:",
          sectionsError
        );
        return NextResponse.json(
          {
            error: "Competency created, but failed to save sections.",
            competencyId,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        competencyId,
        competency,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/competencies] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error saving competency." },
      { status: 500 }
    );
  }
}

// Optional: reject GET explicitly so you see a clean JSON error instead of HTML
export async function GET() {
  return NextResponse.json(
    { error: "Use POST to create competencies." },
    { status: 405 }
  );
}
