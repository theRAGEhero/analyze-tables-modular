import { PlanAnalysisRequest } from "@/types/plan-analysis"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

const DEFAULT_OLLAMA_URL = "http://localhost:11434"

function formatPlanPrompt(request: PlanAnalysisRequest): string {
  const { plan, recap, prompt } = request

  const textEntries = recap.textEntries
    .map((entry) => `- (${entry.userEmail}) ${entry.content}`)
    .join("\n")

  const meditationSessions = recap.meditationSessions
    .map(
      (session) =>
        `- Meditation ${session.meditationIndex} (after round ${
          session.roundAfter ?? "?"
        }) by ${session.userEmail}: ${session.transcriptText}`
    )
    .join("\n")

  const meetingTranscripts = recap.meetingTranscripts
    .map(
      (meeting) =>
        `- Round ${meeting.roundNumber} (${meeting.meetingId}) with ${
          meeting.participants.join(", ") || "unknown participants"
        }: ${meeting.transcriptText}`
    )
    .join("\n")

  return `
${prompt}

## Plan
- Title: ${plan.title}
- Start: ${plan.startAt}
- Timezone: ${plan.timezone ?? "Local"}
- Rounds: ${plan.roundsCount}
- Round duration: ${plan.roundDurationMinutes} minutes
- Language: ${plan.language}
- Transcription provider: ${plan.transcriptionProvider}

## Participants
${recap.participants.length ? recap.participants.join(", ") : "No participants listed."}

## Text Entries
${textEntries || "No text entries."}

## Meditation Sessions
${meditationSessions || "No meditation transcripts."}

## Meeting Transcripts
${meetingTranscripts || "No meeting transcripts."}

## Instructions
Provide a structured response with:
1. Key findings
2. Detailed analysis
3. Summary
  `.trim()
}

export async function analyzePlanWithGemini(request: PlanAnalysisRequest): Promise<string> {
  const formattedPrompt = formatPlanPrompt(request)
  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: formattedPrompt }]
        }
      ]
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Gemini API error:", errorData)
    throw new Error(`Gemini API request failed: ${response.statusText}`)
  }

  const data = await response.json()
  const analysisText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!analysisText) {
    throw new Error("No response from Gemini API")
  }

  return analysisText
}

export async function analyzePlanWithOllama(request: PlanAnalysisRequest): Promise<string> {
  const formattedPrompt = formatPlanPrompt(request)
  const baseUrl = process.env.OLLAMA_API_URL || DEFAULT_OLLAMA_URL
  const model = process.env.OLLAMA_MODEL

  if (!model) {
    throw new Error("OLLAMA_MODEL is not configured")
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: formattedPrompt,
      stream: false
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Ollama API error:", errorData)
    throw new Error(`Ollama API request failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { response?: string }
  if (!data.response) {
    throw new Error("No response from Ollama API")
  }

  return data.response
}
