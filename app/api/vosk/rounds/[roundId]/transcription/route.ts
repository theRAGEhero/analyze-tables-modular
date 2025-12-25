/**
 * Proxy route to fetch transcriptions from VOSK-modular
 * GET /api/vosk/rounds/[roundId]/transcription
 */

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_BASE_URL = 'http://localhost:3009'

export async function GET(
  request: NextRequest,
  context: { params: { roundId: string } }
) {
  try {
    const baseUrl = process.env.VOSK_API_URL || DEFAULT_BASE_URL
    const { roundId } = context.params

    const response = await fetch(`${baseUrl}/api/rounds/${roundId}/transcription`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Failed to fetch VOSK transcription', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch VOSK transcription', details: message },
      { status: 500 }
    )
  }
}
