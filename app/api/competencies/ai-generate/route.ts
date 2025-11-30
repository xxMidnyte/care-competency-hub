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
  | "evidence";

type GenerateBody = {
  title: string;
  description?: string;
  roles: string[];
  setting?: string | null;
  risk?: string;
  language?: string; // en, es, so, hmn
  sections?: SectionKey[]; // which sections to include
  specialInstructions?: string;
};

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
      specialInstructions = "",
    } = body;

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

    const requestedSections: SectionKey[] =
      (sections && sections.length
        ? sections
        : [
            "objectives",
            "equipment",
            "procedure",
            "checklist",
            "quiz",
            "policy",
            "documentation",
            "evidence",
          ]) as SectionKey[];

    const languageLabel =
      LANGUAGE_LABELS[language] ?? "English";

    const roleList = roles.join(", ");

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
  "evidence": string | null
}

Rules:
- "purpose" is ALWAYS present (never null).
- For all other properties, if the caller did NOT request that section, set it to null.
- All content must primarily be written in ${languageLabel}.
- Focus on concise, practical, real-world language suitable for busy clinicians.
- Use bullet points or numbered lists where appropriate.
- For quiz questions, generate 4–8 short questions, no answers.
- For quiz content, keep questions in ${languageLabel} as well.
- Do NOT include any keys besides the ones listed above.
    `.trim();

    // 🔹 User prompt: inject context from the UI
    const userPrompt = `
Create a clinical competency for "${title}".

Context:
- Roles: ${roleList}
- Setting: ${setting || "Not specified (assume typical clinical setting)"}
- Risk level: ${risk}
- Description: ${description || "No additional description provided."}
- Target language: ${languageLabel}
- Special instructions from the manager: ${
      specialInstructions || "None provided."
    }

The caller only wants these sections (others must be null):
${requestedSections.join(", ")}

Produce content that:
- Is appropriate for the roles listed.
- Reflects the risk level (more risk = more depth and rigor).
- Is specific enough that a manager can evaluate competency.
- Includes quiz questions that match the content of the competency.
`.trim();

    // 🔹 Call OpenAI
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

    let parsed: Record<SectionKey, string | null>;
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
      purpose: parsed.purpose || "",
      objectives: null,
      equipment: null,
      procedure: null,
      checklist: null,
      quiz: null,
      policy: null,
      documentation: null,
      evidence: null,
    };

    // Only keep the requested sections (others → null)
    ([
      "objectives",
      "equipment",
      "procedure",
      "checklist",
      "quiz",
      "policy",
      "documentation",
      "evidence",
    ] as SectionKey[]).forEach((key) => {
      if (requestedSections.includes(key) && parsed[key]) {
        result[key] = parsed[key] as string;
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
