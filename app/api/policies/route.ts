import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const orgId = searchParams.get("orgId");
  const facilityId = searchParams.get("facilityId");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const includeArchived = searchParams.get("includeArchived") === "true";

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from("policies")
      .select("*")
      .eq("org_id", orgId)
      .order("title", { ascending: true });

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    if (facilityId && facilityId !== "all") {
      query = query.eq("facility_id", facilityId);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    // --- ENHANCED SEARCH LOGIC ---
    if (q) {
      // This searches the title, description, AND the tags array
      // Note: We cast tags to text for a broad partial match search
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{"${q}"}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/policies error:", error);
      return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }

    return NextResponse.json({ policies: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, facilityId, title, description, fileUrl, category, tags, createdBy } = body;

    if (!orgId || !title || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure tags are stored as a clean array for the database
    const finalTags = Array.isArray(tags) ? tags : [];

    const { data, error } = await supabaseAdmin
      .from("policies")
      .insert({
        org_id: orgId,
        facility_id: facilityId ?? null,
        title,
        description: description ?? null,
        file_url: fileUrl,
        category: category ?? "Other",
        tags: finalTags, // Supabase handles the array conversion
        created_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ policy: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}