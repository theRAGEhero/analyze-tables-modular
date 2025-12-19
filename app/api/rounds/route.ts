/**
 * API route to fetch rounds from Deepgram-modular
 * GET /api/rounds
 */

import { NextResponse } from 'next/server'
import { fetchRounds } from '@/lib/api/deepgram-client'

export async function GET() {
  try {
    const rounds = await fetchRounds()

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
    console.error('Error fetching rounds:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch rounds',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
