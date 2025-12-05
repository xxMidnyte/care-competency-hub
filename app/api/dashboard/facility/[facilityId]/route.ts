// app/api/policies/[policyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Helper: tiny validator to avoid obviously bad IDs
function isUuid(value: string | undefined): value is string {
  return !!value && /^[0-9a-fA-F-]{36}$/.test(value);
}

/**
 * GET /api/policies/[policyId]
 * Returns a single policy row.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await context.params;

  if (!isUuid(policyId)) {
    return NextResponse.json(
      { error: "Invalid policyId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("id", policyId)
    .single();

  if (error) {
    console.error("GET /api/policies/[policyId] error:", error);
    return NextResponse.json(
      { error: "Failed to load policy" },
      { status: 500 }
    );
  }

  return NextResponse.json({ policy: data }, { status: 200 });
}

/**
 * PATCH /api/policies/[policyId]
 * Updates fields on a policy. Body should be a partial policy object.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await context.params;

  if (!isUuid(policyId)) {
    return NextResponse.json(
      { error: "Invalid policyId" },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Don’t allow client to change the primary key
  delete body.id;

  const { data, error } = await supabase
    .from("policies")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
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

  return NextResponse.json({ policy: data }, { status: 200 });
}

/**
 * DELETE /api/policies/[policyId]
 * Deletes a policy row.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await context.params;

  if (!isUuid(policyId)) {
    return NextResponse.json(
      { error: "Invalid policyId" },
      { status: 400 }
    );
  }

  const { error } = await supabase
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

  return NextResponse.json({ success: true }, { status: 200 });
}
