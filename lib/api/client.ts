/**
 * Client-side API wrapper
 * Used by client components to fetch data from our Next.js API routes
 */

import { Round } from '@/types/round'
import { DeliberationOntology } from '@/types/deliberation'

/**
 * Fetch all rounds (client-side)
 */
export async function fetchRoundsClient(): Promise<Round[]> {
  try {
    const response = await fetch('/api/rounds', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch rounds: ${response.statusText}`)
    }

    const data = await response.json()
    return data.rounds || []
  } catch (error) {
    console.error('Error fetching rounds:', error)
    throw new Error('Failed to fetch rounds')
  }
}

/**
 * Fetch transcription for a specific round (client-side)
 * This goes through our Next.js API route which proxies to Deepgram-modular
 */
export async function fetchTranscriptionClient(roundId: string): Promise<DeliberationOntology> {
  try {
    const response = await fetch(
      `/api/rounds/${roundId}/transcription`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to fetch transcription for round ${roundId}:`, errorData)
      throw new Error(`Failed to fetch transcription: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching transcription for round ${roundId}:`, error)
    throw new Error(`Failed to fetch transcription for round ${roundId}`)
  }
}

/**
 * Fetch multiple transcriptions (client-side)
 */
export async function fetchMultipleTranscriptionsClient(
  roundIds: string[],
  rounds: Round[]
): Promise<Array<{ roundId: string; roundName: string; data: DeliberationOntology }>> {
  try {
    const transcriptions = await Promise.all(
      roundIds.map(async (id) => {
        const round = rounds.find(r => r.id === id)
        if (!round) {
          throw new Error(`Round ${id} not found`)
        }

        const data = await fetchTranscriptionClient(id)
        return {
          roundId: id,
          roundName: round.name,
          data
        }
      })
    )

    return transcriptions
  } catch (error) {
    console.error('Error fetching multiple transcriptions:', error)
    throw new Error('Failed to fetch transcriptions for selected rounds')
  }
}
