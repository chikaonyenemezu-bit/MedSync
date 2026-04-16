import { NextResponse } from "next/server";
import { triageEngine, type TriageInput } from "@/lib/triage";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TriageInput;

    const result = triageEngine(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Triage API error:", error);
    return NextResponse.json(
      { error: "Invalid triage request" },
      { status: 400 }
    );
  }
}
