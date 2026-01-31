/**
 * API route for AI chat about aggregated transcriptions
 * POST /api/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { chatWithGemini } from '@/lib/api/gemini-client'
import { chatWithOllama } from '@/lib/api/ollama-client'
import { ChatRequest, ChatResponse } from '@/types/analysis'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    const { aggregatedData, messages, provider } = body

    if (!aggregatedData || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: aggregatedData and messages' },
        { status: 400 }
      )
    }

    if (!aggregatedData.allContributions || aggregatedData.allContributions.length === 0) {
      return NextResponse.json(
        { error: 'No contributions found in aggregated data' },
        { status: 400 }
      )
    }

    const selectedProvider = provider === 'ollama' ? 'ollama' : 'gemini'
    const assistantReply = selectedProvider === 'ollama'
      ? await chatWithOllama(aggregatedData, messages)
      : await chatWithGemini(aggregatedData, messages)

    const response: ChatResponse = {
      message: {
        role: 'assistant',
        content: assistantReply
      },
      timestamp: new Date().toISOString(),
      roundsAnalyzed: aggregatedData.totalRounds,
      metadata: {
        model: selectedProvider === 'ollama'
          ? (process.env.OLLAMA_MODEL || 'ollama')
          : 'gemini-2.5-flash'
      }
    }

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Error in chat API route:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Failed to chat about transcriptions',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to chat about transcriptions.' },
    { status: 405 }
  )
}
