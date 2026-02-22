// app/api/competencies/ai-generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish",
  so: "Somali",
  hmn: "Hmong",
};

type SectionKey =
  | "purpose"
  | "objectives"
  | "equipment"
  | "procedure"
  | "checklist"
  | "quiz"
  | "policy"
  | "documentation"
  | "evidence"
  | "reassignment";

type GenerateMeta = {
  tier?: string;
  evidence?: string;
  reassignment?: string;
};

type GenerateBody = {
  title: string;
  description?: string;
  roles: string[];
  setting?: string | null;
  risk?: string;
  language?: string; // en, es, so, hmn
  sections?: SectionKey[]; // which sections to include
  meta?: GenerateMeta; // ✅ NEW: tier/evidence/reassignment hints
  specialInstructions?: string;
};

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateBody>;

    const {
      title,
      description = "",
      roles,
      setting,
      risk = "Medium",
      language = "en",
      sections,
      meta,
      specialInstructions = "",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: "At least one role is required." },
        { status: 400 }
      );
    }

    const requestedSections: SectionKey[] =
      (sections && sections.length
        ? sections
        : ([
            "objectives",
            "equipment",
            "procedure",
            "checklist",
            "quiz",
            "policy",
            "documentation",
            "evidence",
            "reassignment",
          ] as SectionKey[])) as SectionKey[];

    const languageLabel = LANGUAGE_LABELS[language] ?? "English";
    const roleList = roles.join(", ");

    const metaTier = safeStr(meta?.tier).trim();
    const metaEvidence = safeStr(meta?.evidence).trim();
    const metaReassign = safeStr(meta?.reassignment).trim();

    // 🔹 System prompt: define the job + output format
    const systemPrompt = `
You are an expert nurse educator and clinical competency specialist.
You create structured, practical, regulation-aware competencies for healthcare staff.

You ALWAYS respond with a single JSON object, no markdown, no explanation.
Newlines and bullet points are allowed INSIDE the JSON string values.

The JSON shape MUST be:

{
  "purpose": string,
  "objectives": string | null,
  "equipment": string | null,
  "procedure": string | null,
  "checklist": string | null,
  "quiz": string | null,
  "policy": string | null,
  "documentation": string | null,
  "evidence": string | null,
  "reassignment": string | null
}

Rules:
- "purpose" is ALWAYS present (never null).
- For all other properties, if the caller did NOT request that section, set it to null.
- All content must primarily be written in ${languageLabel}.
- Focus on concise, practical, real-world language suitable for busy clinicians.
- Use bullet points or numbered lists where appropriate.
- For quiz questions, generate 4–8 short questions, no answers.
- Do NOT include any keys besides the ones listed above.
    `.trim();

    // 🔹 User prompt: inject context from the UI + meta hints
    const userPrompt = `
Create a clinical competency for "${title}".

Context:
- Roles: ${roleList}
- Setting: ${setting || "Not specified (assume typical clinical setting)"}
- Risk level: ${risk}
- Description: ${description || "No additional description provided."}
- Target language: ${languageLabel}
- Special instructions from the manager: ${specialInstructions || "None provided."}

Library metadata (use these as guiding defaults; align your content to them):
- Tier (label only): ${metaTier || "Not provided"}
- Evidence (preferred): ${metaEvidence || "Not provided"}
- Reassignment (preferred): ${metaReassign || "Not provided"}

The caller only wants these sections (others must be null):
${requestedSections.join(", ")}

Quality rules:
- Make it appropriate for the roles listed (and the setting).
- Reflect the risk level (higher risk = more depth + stricter evaluation).
- Make it specific enough a manager can evaluate competency.
- If "evidence" is requested, ensure the evidence expectations match the preferred Evidence above (if provided).
- If "reassignment" is requested, provide a clear reassignment rule that matches the preferred Reassignment above (if provided).
- Keep language plain and actionable (avoid fluff).
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json(
        { error: "No content generated from AI." },
        { status: 500 }
      );
    }

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err, raw);
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 500 }
      );
    }

    // 🔹 Safety: enforce structure + filter sections
    const result: Record<SectionKey, string | null> = {
      purpose: safeStr(parsed.purpose) || "",
      objectives: null,
      equipment: null,
      procedure: null,
      checklist: null,
      quiz: null,
      policy: null,
      documentation: null,
      evidence: null,
      reassignment: null,
    };

    ([
      "objectives",
      "equipment",
      "procedure",
      "checklist",
      "quiz",
      "policy",
      "documentation",
      "evidence",
      "reassignment",
    ] as SectionKey[]).forEach((key) => {
      if (requestedSections.includes(key) && safeStr(parsed[key]).trim()) {
        result[key] = safeStr(parsed[key]);
      } else {
        result[key] = null;
      }
    });

    return NextResponse.json(
      {
        sections: result,
        meta: {
          title,
          roles,
          setting,
          risk,
          language,
          // ✅ echo back the library meta for convenience / logging
          tier: metaTier || null,
          evidence: metaEvidence || null,
          reassignment: metaReassign || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("AI competency generate error:", error);
    return NextResponse.json(
      { error: "Unexpected error generating competency." },
      { status: 500 }
    );
  }
}
