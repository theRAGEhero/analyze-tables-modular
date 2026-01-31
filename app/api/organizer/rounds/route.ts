/**
 * Proxy route to fetch rounds from DR-Organizer
 * GET /api/organizer/rounds
 */

import { NextResponse } from 'next/server'
import { createRequestId, logError, logInfo } from '@/lib/logger'

const DEFAULT_BASE_URL = 'http://localhost:3005'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = createRequestId()
  try {
    const baseUrl = process.env.DR_ORGANIZER_API_URL || DEFAULT_BASE_URL
    logInfo('organizer.rounds.request', { requestId, baseUrl })
    const response = await fetch(`${baseUrl}/api/rounds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logError('organizer.rounds.response_error', {
        requestId,
        status: response.status,
        error: errorData
      })
      return NextResponse.json(
        { error: 'Failed to fetch organizer rounds', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    logInfo('organizer.rounds.response_ok', {
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
    logError('organizer.rounds.exception', { requestId, message })
    return NextResponse.json(
      { error: 'Failed to fetch organizer rounds', details: message },
      { status: 500 }
    )
  }
}
