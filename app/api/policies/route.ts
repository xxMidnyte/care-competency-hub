// app/api/policies/route.ts
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
    return NextResponse.json(
      { error: "orgId is required" },
      { status: 400 }
    );
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

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/policies error:", error);
      return NextResponse.json(
        { error: "Failed to load policies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ policies: data ?? [] });
  } catch (err) {
    console.error("GET /api/policies exception:", err);
    return NextResponse.json(
      { error: "Unexpected error loading policies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      orgId,
      facilityId,
      title,
      description,
      fileUrl,
      category,
      tags,
      createdBy, // optional; send profile.id from the client if you want
    } = body as {
      orgId: string;
      facilityId?: string | null;
      title: string;
      description?: string | null;
      fileUrl: string;
      category?: string;
      tags?: string[];
      createdBy?: string | null;
    };

    if (!orgId || !title || !fileUrl) {
      return NextResponse.json(
        { error: "orgId, title, and fileUrl are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("policies")
      .insert({
        org_id: orgId,
        facility_id: facilityId ?? null,
        title,
        description: description ?? null,
        file_url: fileUrl,
        category: (category as any) ?? "Other",
        tags: tags ? JSON.stringify(tags) : "[]",
        created_by: createdBy ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("POST /api/policies error:", error);
      return NextResponse.json(
        { error: "Failed to create policy" },
        { status: 500 }
      );
    }

    return NextResponse.json({ policy: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/policies exception:", err);
    return NextResponse.json(
      { error: "Unexpected error creating policy" },
      { status: 500 }
    );
  }
}
