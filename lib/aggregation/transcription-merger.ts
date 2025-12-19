/**
 * Utility for merging multiple DeliberationOntology objects
 * Combines participants, contributions, and statistics from multiple rounds
 */

import { DeliberationOntology } from '@/types/deliberation'
import {
  AggregatedTranscription,
  ExtendedParticipant,
  ExtendedContribution,
  RoundTranscriptionData
} from '@/types/aggregation'

/**
 * Merge multiple transcriptions into a single aggregated structure
 */
export function mergeTranscriptions(
  transcriptions: RoundTranscriptionData[]
): AggregatedTranscription {
  const allParticipants: ExtendedParticipant[] = []
  const allContributions: ExtendedContribution[] = []

  let totalSpeakers = 0
  let totalContributions = 0
  let totalWords = 0
  let totalDurationSeconds = 0

  // Aggregate data from each round
  transcriptions.forEach(({ roundId, roundName, data }) => {
    // Add participants with source metadata
    data.participants.forEach((participant) => {
      allParticipants.push({
        ...participant,
        sourceRound: roundId,
        sourceRoundName: roundName
      })
    })

    // Add contributions with source metadata
    data.contributions.forEach((contribution) => {
      allContributions.push({
        ...contribution,
        sourceRound: roundId,
        sourceRoundName: roundName
      })
    })

    // Aggregate statistics
    totalSpeakers += data.statistics.total_speakers
    totalContributions += data.statistics.total_contributions
    totalWords += data.statistics.total_words
    totalDurationSeconds += data.statistics.duration_seconds
  })

  // Sort contributions chronologically by start time
  allContributions.sort((a, b) => a.start_time_seconds - b.start_time_seconds)

  return {
    totalRounds: transcriptions.length,
    roundIds: transcriptions.map(t => t.roundId),
    roundNames: transcriptions.map(t => t.roundName),
    allParticipants,
    allContributions,
    combinedStatistics: {
      total_rounds: transcriptions.length,
      total_speakers: totalSpeakers,
      total_contributions: totalContributions,
      total_words: totalWords,
      total_duration_seconds: totalDurationSeconds
    }
  }
}

/**
 * Get unique speakers across all aggregated rounds
 */
export function getUniqueSpeakers(data: AggregatedTranscription): ExtendedParticipant[] {
  const uniqueSpeakers = new Map<string, ExtendedParticipant>()

  data.allParticipants.forEach(participant => {
    // Use identifier + sourceRound as unique key to preserve speaker per round
    const key = `${participant.identifier}-${participant.sourceRound}`
    if (!uniqueSpeakers.has(key)) {
      uniqueSpeakers.set(key, participant)
    }
  })

  return Array.from(uniqueSpeakers.values())
}

/**
 * Get contributions filtered by round
 */
export function getContributionsByRound(
  data: AggregatedTranscription,
  roundId: string
): ExtendedContribution[] {
  return data.allContributions.filter(c => c.sourceRound === roundId)
}

/**
 * Get contributions filtered by speaker
 */
export function getContributionsBySpeaker(
  data: AggregatedTranscription,
  speakerId: string
): ExtendedContribution[] {
  return data.allContributions.filter(c => c.madeBy === speakerId)
}
