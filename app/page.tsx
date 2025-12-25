"use client"

import React, { useEffect, useState } from 'react'
import { Round, RoundStatus } from '@/types/round'
import { RoundsTable } from '@/components/rounds/RoundsTable'
import { PromptEditor } from '@/components/analysis/PromptEditor'
import { ResultsDisplay } from '@/components/analysis/ResultsDisplay'
import { ChatPanel } from '@/components/analysis/ChatPanel'
import { SessionsPanel } from '@/components/sessions/SessionsPanel'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, Sparkles, MessageCircle, ListChecks } from 'lucide-react'
import {
  fetchRoundsClient,
  fetchVoskRoundsClient,
  fetchMultipleTranscriptionsClient,
  fetchOrganizerSessionsClient,
  fetchOrganizerRoundsClient
} from '@/lib/api/client'
import { mergeTranscriptions } from '@/lib/aggregation/transcription-merger'
import { DEFAULT_PROMPT } from '@/lib/prompts/analysis-prompts'
import { AnalysisResponse, ChatMessage, ChatResponse } from '@/types/analysis'
import { AggregatedTranscription } from '@/types/aggregation'
import { Session } from '@/types/session'
import { OrganizerRound } from '@/types/organizer-round'

export default function HomePage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [organizerRounds, setOrganizerRounds] = useState<OrganizerRound[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [provider, setProvider] = useState<"gemini" | "ollama">("gemini")
  const [isLoadingRounds, setIsLoadingRounds] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [cachedAggregation, setCachedAggregation] = useState<AggregatedTranscription | null>(null)
  const [cachedAggregationKey, setCachedAggregationKey] = useState('')

  const selectionKey = React.useMemo(
    () => Array.from(selectedIds).sort().join('|'),
    [selectedIds]
  )
  const completedRoundsCount = React.useMemo(
    () => rounds.filter((round) => round.status === RoundStatus.COMPLETED).length,
    [rounds]
  )
  const activeDeepgramRoundIds = React.useMemo(
    () =>
      new Set(
        rounds
          .filter((round) => round.status === RoundStatus.COMPLETED && round.source === 'deepgram')
          .map((round) => round.id)
      ),
    [rounds]
  )
  const activeVoskRoundIds = React.useMemo(
    () =>
      new Set(
        rounds
          .filter((round) => round.status === RoundStatus.COMPLETED && round.source === 'vosk')
          .map((round) => round.id)
      ),
    [rounds]
  )

  // Fetch rounds on mount
  useEffect(() => {
    loadRounds()
    loadOrganizerData()
  }, [])

  useEffect(() => {
    setChatMessages([])
    setChatInput('')
    setChatError(null)
    setCachedAggregation(null)
    setCachedAggregationKey(selectionKey)
  }, [selectionKey])

  const loadRounds = async () => {
    setIsLoadingRounds(true)
    setError(null)

    try {
      const [deepgramRounds, voskRounds] = await Promise.all([
        fetchRoundsClient(),
        fetchVoskRoundsClient()
      ])
      setRounds([...deepgramRounds, ...voskRounds])
    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setIsLoadingRounds(false)
    }
  }

  const loadOrganizerData = async () => {
    setIsLoadingSessions(true)
    setSessionsError(null)

    try {
      const [sessionsData, roundsData] = await Promise.all([
        fetchOrganizerSessionsClient(),
        fetchOrganizerRoundsClient()
      ])
      setSessions(sessionsData)
      setOrganizerRounds(roundsData)
    } catch (err) {
      const error = err as Error
      setSessionsError(error.message)
    } finally {
      setIsLoadingSessions(false)
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
        body: JSON.stringify({ aggregatedData, prompt, provider })
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

  const getAggregatedData = async () => {
    if (cachedAggregation && cachedAggregationKey === selectionKey) {
      return cachedAggregation
    }

    const transcriptions = await fetchMultipleTranscriptionsClient(
      Array.from(selectedIds),
      rounds
    )

    const aggregated = mergeTranscriptions(transcriptions)
    setCachedAggregation(aggregated)
    setCachedAggregationKey(selectionKey)
    return aggregated
  }

  const handleSendChat = async () => {
    const trimmedInput = chatInput.trim()
    if (!trimmedInput || selectedIds.size === 0 || isChatting) return

    setIsChatting(true)
    setChatError(null)

    const userMessage: ChatMessage = { role: 'user', content: trimmedInput }
    const nextMessages = [...chatMessages, userMessage]
    setChatMessages(nextMessages)
    setChatInput('')

    try {
      const aggregatedData = await getAggregatedData()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregatedData,
          messages: nextMessages,
          provider
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chat request failed')
      }

      const result: ChatResponse = await response.json()
      setChatMessages([...nextMessages, result.message])
    } catch (err) {
      const error = err as Error
      setChatError(error.message)
    } finally {
      setIsChatting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#f7efe0_0%,_#f4efe6_45%,_#f1ede4_100%)]">
      <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="relative container mx-auto px-4 py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-10 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Deliberation intelligence
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Round Analysis Platform
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Aggregate discussion rounds, tune the analysis, and explore insights alongside a
                focused chat companion.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1 text-xs">
                <ListChecks className="h-3.5 w-3.5" />
                {completedRoundsCount} completed
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <MessageCircle className="h-3.5 w-3.5" />
                {selectedIds.size} selected
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rounds</p>
              <p className="font-display mt-2 text-2xl font-semibold text-foreground">{rounds.length}</p>
              <p className="text-sm text-muted-foreground">Total available in the workspace.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready</p>
              <p className="font-display mt-2 text-2xl font-semibold text-foreground">{completedRoundsCount}</p>
              <p className="text-sm text-muted-foreground">Completed and ready to analyze.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected</p>
              <p className="font-display mt-2 text-2xl font-semibold text-foreground">{selectedIds.size}</p>
              <p className="text-sm text-muted-foreground">Rounds queued for AI review.</p>
            </div>
          </div>
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
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Loading rounds...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-12">
            {/* Left column: Rounds selection */}
            <div className="space-y-6 lg:col-span-7">
              <SessionsPanel
                sessions={sessions}
                rounds={organizerRounds}
                activeDeepgramRoundIds={activeDeepgramRoundIds}
                activeVoskRoundIds={activeVoskRoundIds}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                isLoading={isLoadingSessions}
                error={sessionsError}
              />
              <RoundsTable
                rounds={rounds}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
              </div>

              {/* Right column: Prompt editor and analysis */}
            <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-6 self-start">
              <PromptEditor value={prompt} onChange={setPrompt} />

              <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  AI Provider
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={provider === "gemini" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setProvider("gemini")}
                  >
                    Gemini
                  </Button>
                  <Button
                    type="button"
                    variant={provider === "ollama" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setProvider("ollama")}
                  >
                    Ollama
                  </Button>
                </div>
              </div>

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
                      Run Analysis ({selectedIds.size} round{selectedIds.size !== 1 ? 's' : ''})
                    </>
                  )}
                </Button>

                {/* Info message when no rounds selected */}
                {selectedIds.size === 0 && !isAnalyzing && (
                  <Alert>
                    <AlertDescription>
                      Select one or more completed rounds from the table to begin analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {analysis ? (
                <ResultsDisplay
                  analysis={analysis.analysis}
                  metadata={{
                    roundsAnalyzed: analysis.roundsAnalyzed,
                    timestamp: analysis.timestamp,
                    model: analysis.metadata?.model
                  }}
                  onClear={() => setAnalysis(null)}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
                  Run an analysis to see a structured summary and highlighted quotes.
                </div>
              )}

              <ChatPanel
                messages={chatMessages}
                input={chatInput}
                onInputChange={setChatInput}
                onSend={handleSendChat}
                onClear={() => {
                  setChatMessages([])
                  setChatInput('')
                  setChatError(null)
                }}
                isSending={isChatting}
                disabled={selectedIds.size === 0}
                error={chatError}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/60 text-center text-sm text-muted-foreground">
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
