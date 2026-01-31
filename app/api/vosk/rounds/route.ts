/**
 * Proxy route to fetch rounds from VOSK-modular
 * GET /api/vosk/rounds
 */

import { NextResponse } from 'next/server'
import { createRequestId, logError, logInfo } from '@/lib/logger'

const DEFAULT_BASE_URL = 'http://localhost:3009'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = createRequestId()
  try {
    const baseUrl = process.env.VOSK_API_URL || DEFAULT_BASE_URL
    logInfo('vosk.rounds.request', { requestId, baseUrl })
    const response = await fetch(`${baseUrl}/api/rounds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logError('vosk.rounds.response_error', {
        requestId,
        status: response.status,
        error: errorData
      })
      return NextResponse.json(
        { error: 'Failed to fetch VOSK rounds', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    logInfo('vosk.rounds.response_ok', {
      requestId,
      count: Array.isArray(data?.rounds) ? data.rounds.length : null
    })
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logError('vosk.rounds.exception', { requestId, message })
    return NextResponse.json(
      { error: 'Failed to fetch VOSK rounds', details: message },
      { status: 500 }
    )
  }
}
