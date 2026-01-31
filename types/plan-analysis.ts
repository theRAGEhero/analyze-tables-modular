export type PlanAnalysisRequest = {
  plan: {
    id: string
    title: string
    startAt: string
    timezone: string | null
    roundsCount: number
    roundDurationMinutes: number
    language: string
    transcriptionProvider: string
  }
  recap: {
    textEntries: Array<{
      blockId: string
      content: string
      userEmail: string
    }>
    meditationSessions: Array<{
      meditationIndex: number
      roundAfter: number | null
      transcriptText: string
      userEmail: string
      createdAt: string
    }>
    meetingTranscripts: Array<{
      meetingId: string
      roundNumber: number
      participants: string[]
      transcriptText: string
    }>
    participants: string[]
  }
  prompt: string
  provider?: "gemini" | "ollama"
}

export type PlanAnalysisResponse = {
  planId: string
  analysis: string
  timestamp: string
  metadata?: {
    model?: string
  }
}
