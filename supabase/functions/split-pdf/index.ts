import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PDFDocument } from 'https://esm.sh/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mirrors the category vocabulary used by app/dashboard/policies/page.tsx
const CATEGORY_MAP: Record<string, string> = {
  "HR": "HR",
  "Human Resources": "HR",
  "Personnel": "HR",
  "Clinical": "Clinical",
  "Medical": "Clinical",
  "Nursing": "Clinical",
  "Safety": "Safety",
  "OSHA": "Safety",
  "Emergency": "Emergency",
  "Disaster": "Emergency",
  "Infection Control": "Infection Control",
  "Sanitation": "Infection Control",
  "Administrative": "Administrative",
  "Office": "Administrative",
  "Billing": "Administrative",
}
const OFFICIAL_CATEGORIES = ["HR", "Clinical", "Safety", "Emergency", "Infection Control", "Administrative", "Other"]

const CHUNK_SIZE = 8

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL = 'gemini-3.6-flash'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function extractPolicyMetadata(pageBase64: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  'This is one page from a facility policy handbook. Extract a short title, a one-sentence ' +
                  'description, a suggested category, and up to 4 tags.',
              },
              { inline_data: { mime_type: 'application/pdf', data: pageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              description: { type: 'STRING' },
              ai_suggested_category: { type: 'STRING' },
              tags: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['title', 'description', 'ai_suggested_category', 'tags'],
          },
        },
      }),
    },
  )

  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  return JSON.parse(text)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { fileBase64, batchId, startIdx = 0 } = await req.json()

    if (!fileBase64 || !batchId) {
      return new Response(JSON.stringify({ error: 'fileBase64 and batchId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pdfBytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0))
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const totalChunksFound = pdfDoc.getPageCount()
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalChunksFound)

    const policies = []

    for (let i = startIdx; i < endIdx; i++) {
      const pagePdf = await PDFDocument.create()
      const [page] = await pagePdf.copyPages(pdfDoc, [i])
      pagePdf.addPage(page)
      const pageBase64 = bytesToBase64(await pagePdf.save())

      const object = await extractPolicyMetadata(pageBase64)
      const normalizedCategory =
        CATEGORY_MAP[object.ai_suggested_category] ||
        (OFFICIAL_CATEGORIES.includes(object.ai_suggested_category) ? object.ai_suggested_category : 'Other')

      policies.push({
        title: object.title || `Policy Segment ${i + 1}`,
        description: object.description || '',
        category: normalizedCategory,
        tags: Array.isArray(object.tags) ? object.tags : [],
        source_batch_id: batchId,
      })
    }

    return new Response(JSON.stringify({ policies, totalChunksFound }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
