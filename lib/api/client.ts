/**
 * Client-side API wrapper
 * Used by client components to fetch data from our Next.js API routes
 */

import { Round } from '@/types/round'
import { Session } from '@/types/session'
import { OrganizerRound } from '@/types/organizer-round'
import { DeliberationOntology } from '@/types/deliberation'

type RoundSource = "deepgram" | "vosk"

export function buildRoundSelectionId(source: RoundSource, id: string) {
  return `${source}:${id}`
}

const toSelectionRound = (round: Round, source: RoundSource): Round => ({
  ...round,
  source,
  sourceId: round.id,
  id: buildRoundSelectionId(source, round.id)
})

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
    return (data.rounds || []).map((round: Round) => toSelectionRound(round, "deepgram"))
  } catch (error) {
    console.error('Error fetching rounds:', error)
    throw new Error('Failed to fetch rounds')
  }
}

/**
 * Fetch rounds from VOSK-modular (client-side)
 */
export async function fetchVoskRoundsClient(): Promise<Round[]> {
  try {
    const response = await fetch('/api/vosk/rounds', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch VOSK rounds: ${response.statusText}`)
    }

    const data = await response.json()
    return (data.rounds || []).map((round: Round) => toSelectionRound(round, "vosk"))
  } catch (error) {
    console.error('Error fetching VOSK rounds:', error)
    throw new Error('Failed to fetch VOSK rounds')
  }
}

/**
 * Fetch sessions from DR-Organizer (client-side)
 */
export async function fetchOrganizerSessionsClient(): Promise<Session[]> {
  try {
    const response = await fetch('/api/organizer/sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }

    const data = await response.json()
    return data.sessions || []
  } catch (error) {
    console.error('Error fetching sessions:', error)
    throw new Error('Failed to fetch sessions')
  }
}

/**
 * Fetch rounds from DR-Organizer (client-side)
 */
export async function fetchOrganizerRoundsClient(): Promise<OrganizerRound[]> {
  try {
    const response = await fetch('/api/organizer/rounds', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch organizer rounds: ${response.statusText}`)
    }

    const data = await response.json()
    return data.rounds || []
  } catch (error) {
    console.error('Error fetching organizer rounds:', error)
    throw new Error('Failed to fetch organizer rounds')
  }
}

/**
 * Fetch transcription for a specific round (client-side)
 * This goes through our Next.js API route which proxies to Deepgram-modular
 */
export async function fetchTranscriptionClient(
  roundId: string,
  source: RoundSource = "deepgram"
): Promise<DeliberationOntology> {
  try {
    const routeBase = source === "vosk" ? '/api/vosk/rounds' : '/api/rounds'
    const response = await fetch(
      `${routeBase}/${roundId}/transcription`,
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

        const sourceId = round.sourceId || round.id
        const source = round.source || "deepgram"
        const data = await fetchTranscriptionClient(sourceId, source)
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
