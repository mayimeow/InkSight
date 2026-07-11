import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function buildPrompt(rubric: any, essayContent: string) {
  const conceptList = rubric.concepts
    .map((c: any) => `- ${c.label} (${c.points} points)`)
    .join("\n")

  return `You are grading a student essay. Reply ONLY with valid JSON, no markdown, no preamble.

Assignment prompt: ${rubric.prompt}
Maximum score: ${rubric.max_score}
Additional grading guidance: ${rubric.rubric_guidance || "None"}

Required concepts to check for:
${conceptList}

Student essay:
"""
${essayContent}
"""

Respond in EXACTLY this JSON shape:
{
  "score": <number, 0 to ${rubric.max_score}>,
  "missing_points": [<array of concept names the essay failed to address>],
  "feedback": "<2-3 sentence constructive feedback for the student>"
}`
}

// ---------- PRIMARY: Groq ----------
async function callGroq(prompt: string, imageBase64?: string) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq not configured (no API key set)")
  }

  const content: any[] = [{ type: "text", text: prompt }]
  const model = imageBase64
    ? "meta-llama/llama-4-scout-17b-16e-instruct" // vision-capable
    : "llama-3.3-70b-versatile" // text-only, faster

  if (imageBase64) {
    content.push({ type: "image_url", image_url: { url: imageBase64 } })
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error("Groq returned no content")
  return text
}

// ---------- FALLBACK: Gemini ----------
async function callGemini(prompt: string, imageBase64?: string) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini fallback not configured (no API key set)")
  }

  const parts: any[] = [{ text: prompt }]
  if (imageBase64) {
    const [meta, data] = imageBase64.split(",")
    const mimeType = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg"
    parts.push({ inline_data: { mime_type: mimeType, data } })
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini returned no content")
  return text
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { rubric, essayContent, imageBase64 } = await req.json()
    const prompt = buildPrompt(rubric, essayContent || "(see attached image)")

    const startTime = Date.now()
    let engineUsed = "groq"
    let rawText: string

    try {
      rawText = await callGroq(prompt, imageBase64)
    } catch (groqError) {
      const msg = groqError instanceof Error ? groqError.message : String(groqError)
      console.error("Groq failed, trying Gemini fallback:", msg)
      engineUsed = "gemini"
      rawText = await callGemini(prompt, imageBase64)
    }

    const latencyMs = Date.now() - startTime
    const parsed = extractJson(rawText)
    const estimatedTokens = Math.round((prompt.length + rawText.length) / 4)

    return new Response(
      JSON.stringify({
        score: parsed.score,
        missing_points: parsed.missing_points || [],
        feedback: parsed.feedback || "",
        engine_used: engineUsed,
        latency_ms: latencyMs,
        token_count: estimatedTokens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("grade-essay error:", msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})