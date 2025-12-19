/**
 * Client for interacting with Deepgram-modular API
 * Fetches rounds and transcription data
 */

import { Round } from '@/types/round'
import { DeliberationOntology } from '@/types/deliberation'

const API_BASE_URL = process.env.DEEPGRAM_API_URL || 'http://localhost:3000'

/**
 * Fetch all rounds from Deepgram-modular API
 */
export async function fetchRounds(): Promise<Round[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rounds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch rounds: ${response.statusText}`)
    }

    const data = await response.json()
    return data.rounds || []
  } catch (error) {
    console.error('Error fetching rounds:', error)
    throw new Error('Failed to fetch rounds from Deepgram API')
  }
}

/**
 * Fetch transcription data for a specific round
 */
export async function fetchTranscription(roundId: string): Promise<DeliberationOntology> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/transcription`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
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
 * Fetch transcriptions for multiple rounds
 */
export async function fetchMultipleTranscriptions(
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

        const data = await fetchTranscription(id)
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
