/**
 * Type definitions for aggregated transcription data
 */

import { Participant, Contribution, DeliberationOntology } from './deliberation'

export interface ExtendedParticipant extends Participant {
  sourceRound: string
  sourceRoundName: string
}

export interface ExtendedContribution extends Contribution {
  sourceRound: string
  sourceRoundName: string
}

export interface AggregatedStatistics {
  total_rounds: number
  total_speakers: number
  total_contributions: number
  total_words: number
  total_duration_seconds: number
}

export interface AggregatedTranscription {
  totalRounds: number
  roundIds: string[]
  roundNames: string[]
  allParticipants: ExtendedParticipant[]
  allContributions: ExtendedContribution[]
  combinedStatistics: AggregatedStatistics
}

export interface RoundTranscriptionData {
  roundId: string
  roundName: string
  data: DeliberationOntology
}
