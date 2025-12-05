// app/api/user-context/route.ts
import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/userContext";

export async function GET() {
  try {
    const ctx = await getUserContext();
    return NextResponse.json(ctx);
  } catch (error) {
    console.error("Failed to get user context", error);
    return NextResponse.json(null, { status: 500 });
  }
}
