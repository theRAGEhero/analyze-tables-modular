/**
 * API route to fetch transcription from Deepgram-modular (proxy)
 * GET /api/rounds/[roundId]/transcription
 */

import { NextRequest, NextResponse } from 'next/server'

const DEEPGRAM_API_URL = process.env.DEEPGRAM_API_URL || 'http://localhost:3000'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { roundId: string } }
) {
  try {
    const { roundId } = params

    const response = await fetch(
      `${DEEPGRAM_API_URL}/api/rounds/${roundId}/transcription`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Deepgram API error for round ${roundId}:`, errorText)
      throw new Error(`Failed to fetch transcription: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error('Error fetching transcription:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch transcription',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
