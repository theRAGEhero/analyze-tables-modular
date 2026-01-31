/**
 * API route to fetch rounds from Deepgram-modular
 * GET /api/rounds
 */

import { NextResponse } from 'next/server'
import { fetchRounds } from '@/lib/api/deepgram-client'
import { createRequestId, logError, logInfo } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = createRequestId()
  try {
    logInfo('rounds.request', {
      requestId,
      baseUrl: process.env.DEEPGRAM_API_URL || 'http://localhost:3000'
    })
    const rounds = await fetchRounds()

    logInfo('rounds.response_ok', { requestId, count: rounds.length })
    return NextResponse.json(
      { rounds },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logError('rounds.exception', { requestId, message: errorMessage })

    return NextResponse.json(
      {
        error: 'Failed to fetch rounds',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
