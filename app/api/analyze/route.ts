/**
 * API route for AI analysis of aggregated transcriptions
 * POST /api/analyze
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeWithGemini } from '@/lib/api/gemini-client'
import { analyzeWithOllama } from '@/lib/api/ollama-client'
import { AnalysisRequest, AnalysisResponse } from '@/types/analysis'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()

    const { aggregatedData, prompt, provider } = body

    // Validate required fields
    if (!aggregatedData || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: aggregatedData and prompt' },
        { status: 400 }
      )
    }

    // Validate aggregated data has content
    if (!aggregatedData.allContributions || aggregatedData.allContributions.length === 0) {
      return NextResponse.json(
        { error: 'No contributions found in aggregated data' },
        { status: 400 }
      )
    }

    const selectedProvider = provider === 'ollama' ? 'ollama' : 'gemini'
    const analysis = selectedProvider === 'ollama'
      ? await analyzeWithOllama(aggregatedData, prompt)
      : await analyzeWithGemini(aggregatedData, prompt)

    // Prepare response
    const response: AnalysisResponse = {
      analysis,
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
    console.error('Error in analyze API route:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Failed to analyze transcriptions',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze transcriptions.' },
    { status: 405 }
  )
}
