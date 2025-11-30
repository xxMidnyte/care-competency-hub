// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client (service role so it can write)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ContactPayload = {
  name: string;
  email: string;
  organization: string;
  role?: string;
  staffSize?: string;
  reason?: "demo" | "question";
  message: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactPayload>;

    // Basic validation
    if (!body.name || !body.email || !body.organization || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const payload: ContactPayload = {
      name: body.name,
      email: body.email,
      organization: body.organization,
      role: body.role || "",
      staffSize: body.staffSize || "",
      reason: body.reason === "question" ? "question" : "demo",
      message: body.message,
    };

    // Insert into Supabase
    const { error } = await supabase.from("contact_requests").insert({
      name: payload.name,
      email: payload.email,
      organization: payload.organization,
      role: payload.role,
      staff_size: payload.staffSize,
      reason: payload.reason,
      message: payload.message,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase insert error (contact_requests):", error);
      return NextResponse.json(
        { error: "Failed to save request." },
        { status: 500 }
      );
    }

    // TODO (optional): send an email notification here using Resend/SendGrid/etc.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Unexpected error." },
      { status: 500 }
    );
  }
}
