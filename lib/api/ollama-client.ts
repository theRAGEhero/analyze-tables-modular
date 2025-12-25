/**
 * Client for interacting with Ollama REST API
 */

import { AggregatedTranscription } from '@/types/aggregation'
import { ChatMessage } from '@/types/analysis'

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

interface OllamaGenerateResponse {
  response: string
}

interface OllamaChatResponse {
  message: {
    content: string
  }
}

export async function analyzeWithOllama(
  aggregatedData: AggregatedTranscription,
  userPrompt: string
): Promise<string> {
  const formattedPrompt = formatPromptForOllama(aggregatedData, userPrompt)
  return callOllamaGenerate(formattedPrompt)
}

export async function chatWithOllama(
  aggregatedData: AggregatedTranscription,
  messages: ChatMessage[]
): Promise<string> {
  const formattedPrompt = formatChatPromptForOllama(aggregatedData, messages)
  return callOllamaGenerate(formattedPrompt)
}

async function callOllamaGenerate(prompt: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_API_URL || DEFAULT_OLLAMA_URL
  const model = process.env.OLLAMA_MODEL

  if (!model) {
    throw new Error('OLLAMA_MODEL is not configured')
  }

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Ollama API error:', errorData)
    throw new Error(`Ollama API request failed: ${response.statusText}`)
  }

  const data = (await response.json()) as OllamaGenerateResponse
  return data.response
}

function formatPromptForOllama(
  data: AggregatedTranscription,
  userPrompt: string
): string {
  const transcriptionText = data.allContributions
    .map(c => {
      const speakerName = data.allParticipants.find(p => p.identifier === c.madeBy)?.name || c.madeBy
      return `[${c.sourceRoundName}] ${speakerName}: ${c.text}`
    })
    .join('\n\n')

  return `
${userPrompt}

## Context:
- Analyzing ${data.totalRounds} deliberation round(s): ${data.roundNames.join(', ')}
- Total participants: ${data.combinedStatistics.total_speakers}
- Total contributions: ${data.combinedStatistics.total_contributions}
- Total words: ${data.combinedStatistics.total_words}
- Total duration: ${Math.round(data.combinedStatistics.total_duration_seconds / 60)} minutes

## Transcription Data:

${transcriptionText}

## Instructions:
Provide a structured response with:
1. Key findings
2. Detailed analysis
3. Summary
  `.trim()
}

function formatChatPromptForOllama(
  data: AggregatedTranscription,
  messages: ChatMessage[]
): string {
  const transcriptionText = data.allContributions
    .map(c => {
      const speakerName = data.allParticipants.find(p => p.identifier === c.madeBy)?.name || c.madeBy
      return `[${c.sourceRoundName}] ${speakerName}: ${c.text}`
    })
    .join('\n\n')

  const conversation = messages
    .map(message => {
      const label = message.role === 'user' ? 'User' : 'Assistant'
      return `${label}: ${message.content}`
    })
    .join('\n')

  return `
You are a helpful assistant. Answer questions about the selected deliberation rounds.

## Context:
- Analyzing ${data.totalRounds} deliberation round(s): ${data.roundNames.join(', ')}
- Total participants: ${data.combinedStatistics.total_speakers}
- Total contributions: ${data.combinedStatistics.total_contributions}
- Total words: ${data.combinedStatistics.total_words}
- Total duration: ${Math.round(data.combinedStatistics.total_duration_seconds / 60)} minutes

## Transcription Data:

${transcriptionText}

## Conversation:
${conversation}

Assistant:
  `.trim()
}
