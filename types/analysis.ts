/**
 * Type definitions for Gemini AI analysis
 */

export interface GeminiRequest {
  contents: GeminiContent[]
}

export interface GeminiContent {
  parts: GeminiPart[]
}

export interface GeminiPart {
  text: string
}

export interface GeminiResponse {
  candidates: GeminiCandidate[]
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export interface GeminiCandidate {
  content: GeminiContent
  finishReason?: string
  index?: number
  safetyRatings?: any[]
}

export interface AnalysisRequest {
  aggregatedData: AggregatedTranscription
  prompt: string
}

export interface AnalysisResponse {
  analysis: string
  timestamp: string
  roundsAnalyzed: number
  metadata?: {
    tokenCount?: number
    model: string
  }
}

// Import from aggregation.ts
import { AggregatedTranscription } from './aggregation'
