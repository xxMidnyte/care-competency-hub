// app/api/policies/[policyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteParams = { params: { policyId: string } };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { policyId } = params;

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      tags,
      facilityId,
      isArchived,
      versionNumber,
    } = body as {
      title?: string;
      description?: string | null;
      category?: string;
      tags?: string[];
      facilityId?: string | null;
      isArchived?: boolean;
      versionNumber?: number;
    };

    const updatePayload: Record<string, any> = {};

    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (category !== undefined) updatePayload.category = category;
    if (facilityId !== undefined) updatePayload.facility_id = facilityId;
    if (tags !== undefined) updatePayload.tags = JSON.stringify(tags);
    if (isArchived !== undefined) updatePayload.is_archived = isArchived;
    if (versionNumber !== undefined) {
      updatePayload.version_number = versionNumber;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("policies")
      .update(updatePayload)
      .eq("id", policyId)
      .select("*")
      .single();

    if (error) {
      console.error("PATCH /api/policies/[policyId] error:", error);
      return NextResponse.json(
        { error: "Failed to update policy" },
        { status: 500 }
      );
    }

    return NextResponse.json({ policy: data });
  } catch (err) {
    console.error("PATCH /api/policies/[policyId] exception:", err);
    return NextResponse.json(
      { error: "Unexpected error updating policy" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { policyId } = params;

  try {
    const { error } = await supabaseAdmin
      .from("policies")
      .delete()
      .eq("id", policyId);

    if (error) {
      console.error("DELETE /api/policies/[policyId] error:", error);
      return NextResponse.json(
        { error: "Failed to delete policy" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/policies/[policyId] exception:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting policy" },
      { status: 500 }
    );
  }
}
