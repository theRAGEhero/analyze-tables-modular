/**
 * Client for interacting with Gemini AI REST API
 * Handles AI analysis of aggregated transcriptions
 */

import { AggregatedTranscription } from '@/types/aggregation'
import { ChatMessage, GeminiRequest, GeminiResponse } from '@/types/analysis'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Analyze aggregated transcription data using Gemini AI
 */
export async function analyzeWithGemini(
  aggregatedData: AggregatedTranscription,
  userPrompt: string
): Promise<string> {
  try {
    const formattedPrompt = formatPromptForGemini(aggregatedData, userPrompt)

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: formattedPrompt
            }
          ]
        }
      ]
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API request failed: ${response.statusText}`)
    }

    const data: GeminiResponse = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    const analysisText = data.candidates[0].content.parts[0].text
    return analysisText

  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw new Error('Failed to analyze transcriptions with Gemini AI')
  }
}

/**
 * Chat about aggregated transcription data using Gemini AI
 */
export async function chatWithGemini(
  aggregatedData: AggregatedTranscription,
  messages: ChatMessage[]
): Promise<string> {
  try {
    const formattedPrompt = formatChatPromptForGemini(aggregatedData, messages)

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: formattedPrompt
            }
          ]
        }
      ]
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API request failed: ${response.statusText}`)
    }

    const data: GeminiResponse = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    const responseText = data.candidates[0].content.parts[0].text
    return responseText

  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw new Error('Failed to chat with Gemini AI')
  }
}

/**
 * Format the prompt with aggregated data for Gemini
 */
function formatPromptForGemini(
  data: AggregatedTranscription,
  userPrompt: string
): string {
  // Create a structured representation of the transcription
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
Please analyze the above transcription data and provide your response based on the given prompt. Structure your response clearly with:
1. Key findings
2. Detailed analysis
3. Summary

Be specific and reference actual quotes from the transcriptions when possible.
  `.trim()
}

function formatChatPromptForGemini(
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
