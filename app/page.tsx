"use client"

import React, { useEffect, useState } from 'react'
import { Round } from '@/types/round'
import { RoundsTable } from '@/components/rounds/RoundsTable'
import { PromptEditor } from '@/components/analysis/PromptEditor'
import { ResultsDisplay } from '@/components/analysis/ResultsDisplay'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import { fetchRoundsClient, fetchMultipleTranscriptionsClient } from '@/lib/api/client'
import { mergeTranscriptions } from '@/lib/aggregation/transcription-merger'
import { DEFAULT_PROMPT } from '@/lib/prompts/analysis-prompts'
import { AnalysisResponse } from '@/types/analysis'

export default function HomePage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [isLoadingRounds, setIsLoadingRounds] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch rounds on mount
  useEffect(() => {
    loadRounds()
  }, [])

  const loadRounds = async () => {
    setIsLoadingRounds(true)
    setError(null)

    try {
      const fetchedRounds = await fetchRoundsClient()
      setRounds(fetchedRounds)
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setIsLoadingRounds(false)
    }
  }

  const handleAnalyze = async () => {
    if (selectedIds.size === 0) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      // Fetch transcriptions for selected rounds
      const transcriptions = await fetchMultipleTranscriptionsClient(
        Array.from(selectedIds),
        rounds
      )

      // Aggregate data
      const aggregatedData = mergeTranscriptions(transcriptions)

      // Call analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggregatedData, prompt })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result: AnalysisResponse = await response.json()
      setAnalysis(result)
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Round Analysis Platform</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            AI-powered analysis of deliberation rounds using Gemini AI
          </p>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoadingRounds ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Loading rounds...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column: Rounds selection */}
            <div className="space-y-6">
              <RoundsTable
                rounds={rounds}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>

            {/* Right column: Prompt editor and analysis */}
            <div className="space-y-6">
              <PromptEditor value={prompt} onChange={setPrompt} />

              {/* Analyze button */}
              <Button
                onClick={handleAnalyze}
                disabled={selectedIds.size === 0 || isAnalyzing || !prompt.trim()}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing {selectedIds.size} round{selectedIds.size !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Analysis ({selectedIds.size} round{selectedIds.size !== 1 ? 's' : ''})
                  </>
                )}
              </Button>

              {/* Results display */}
              {analysis && (
                <ResultsDisplay
                  analysis={analysis.analysis}
                  metadata={{
                    roundsAnalyzed: analysis.roundsAnalyzed,
                    timestamp: analysis.timestamp,
                    model: analysis.metadata?.model
                  }}
                  onClear={() => setAnalysis(null)}
                />
              )}

              {/* Info message when no rounds selected */}
              {!analysis && selectedIds.size === 0 && !isAnalyzing && (
                <Alert>
                  <AlertDescription>
                    Select one or more completed rounds from the table to begin analysis
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <span className="font-semibold">Gemini AI</span> •{' '}
            Data from{' '}
            <span className="font-semibold">Deepgram-modular</span>
          </p>
        </div>
      </div>
    </div>
  )
}
