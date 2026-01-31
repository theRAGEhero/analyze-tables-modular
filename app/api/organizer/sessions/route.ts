/**
 * Proxy route to fetch sessions from DR-Organizer
 * GET /api/organizer/sessions
 */

import { NextResponse } from 'next/server'
import { createRequestId, logError, logInfo } from '@/lib/logger'

const DEFAULT_BASE_URL = 'http://localhost:3005'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = createRequestId()
  try {
    const baseUrl = process.env.DR_ORGANIZER_API_URL || DEFAULT_BASE_URL
    logInfo('organizer.sessions.request', { requestId, baseUrl })
    const response = await fetch(`${baseUrl}/api/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logError('organizer.sessions.response_error', {
        requestId,
        status: response.status,
        error: errorData
      })
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    logInfo('organizer.sessions.response_ok', {
      requestId,
      count: Array.isArray(data?.sessions) ? data.sessions.length : null
    })
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logError('organizer.sessions.exception', { requestId, message })
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: message },
      { status: 500 }
    )
  }
}
