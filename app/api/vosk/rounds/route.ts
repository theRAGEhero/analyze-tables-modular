/**
 * Proxy route to fetch rounds from VOSK-modular
 * GET /api/vosk/rounds
 */

import { NextResponse } from 'next/server'

const DEFAULT_BASE_URL = 'http://localhost:3009'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const baseUrl = process.env.VOSK_API_URL || DEFAULT_BASE_URL
    const response = await fetch(`${baseUrl}/api/rounds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Failed to fetch VOSK rounds', details: errorData },
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
      { error: 'Failed to fetch VOSK rounds', details: message },
      { status: 500 }
    )
  }
}
