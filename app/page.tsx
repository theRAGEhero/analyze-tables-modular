"use client"

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
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
  fetchOrganizerRoundsClient,
  fetchDemocracyRoutesPlansClient,
  fetchDemocracyRoutesPlanClient,
  fetchDemocracyRoutesPlanRecapClient
} from '@/lib/api/client'
import { mergeTranscriptions } from '@/lib/aggregation/transcription-merger'
import { DEFAULT_PROMPT } from '@/lib/prompts/analysis-prompts'
import { AnalysisResponse, ChatMessage, ChatResponse } from '@/types/analysis'
import { AggregatedTranscription } from '@/types/aggregation'
import { WorkflowPlanDetail } from '@/types/plan'
import { PlanAnalysisRequest, PlanAnalysisResponse } from '@/types/plan-analysis'

const PLAN_DEFAULT_PROMPT =
  'Analyze the plan recap and highlight key themes, agreements, disagreements, and notable quotes.'

export default function HomePage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [planPrompt, setPlanPrompt] = useState(PLAN_DEFAULT_PROMPT)
  const [provider, setProvider] = useState<"gemini" | "ollama">("gemini")
  const [planProvider, setPlanProvider] = useState<"gemini" | "ollama">("gemini")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzingPlan, setIsAnalyzingPlan] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [planAnalysis, setPlanAnalysis] = useState<PlanAnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [planAnalysisError, setPlanAnalysisError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [cachedAggregation, setCachedAggregation] = useState<AggregatedTranscription | null>(null)
  const [cachedAggregationKey, setCachedAggregationKey] = useState('')
  const [activePanel, setActivePanel] = useState<'rounds' | 'plans'>('rounds')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<WorkflowPlanDetail | null>(null)
  const [isLoadingPlanDetail, setIsLoadingPlanDetail] = useState(false)
  const [aggregatedPreview, setAggregatedPreview] = useState<AggregatedTranscription | null>(null)
  const [isLoadingAggregation, setIsLoadingAggregation] = useState(false)
  const [planRecap, setPlanRecap] = useState<PlanAnalysisRequest["recap"] | null>(null)
  const [planRecapError, setPlanRecapError] = useState<string | null>(null)
  const [isLoadingPlanRecap, setIsLoadingPlanRecap] = useState(false)

  const {
    data: roundsData,
    error: roundsError,
    isLoading: isLoadingRounds
  } = useSWR(
    'rounds',
    async () => {
      const [deepgramRounds, voskRounds] = await Promise.all([
        fetchRoundsClient(),
        fetchVoskRoundsClient()
      ])
      return [...deepgramRounds, ...voskRounds]
    },
    { revalidateOnFocus: false }
  )

  const {
    data: sessionsData,
    error: sessionsError,
    isLoading: isLoadingSessions
  } = useSWR('organizer-sessions', fetchOrganizerSessionsClient, {
    revalidateOnFocus: false
  })
  const {
    data: organizerRoundsData,
    error: organizerRoundsError,
    isLoading: isLoadingOrganizerRounds
  } = useSWR('organizer-rounds', fetchOrganizerRoundsClient, {
    revalidateOnFocus: false
  })

  const {
    data: plansData,
    error: plansError,
    isLoading: isLoadingPlans,
    mutate: refreshPlans
  } = useSWR('democracy-plans', fetchDemocracyRoutesPlansClient, {
    revalidateOnFocus: false
  })

  const rounds = roundsData ?? []
  const sessions = sessionsData ?? []
  const organizerRounds = organizerRoundsData ?? []
  const plans = plansData ?? []
  const sortedPlans = React.useMemo(() => {
    return [...plans].sort((a, b) => {
      const aTime = new Date(a.startAt).getTime()
      const bTime = new Date(b.startAt).getTime()
      if (aTime !== bTime) return bTime - aTime
      const aUpdated = new Date(a.updatedAt).getTime()
      const bUpdated = new Date(b.updatedAt).getTime()
      return bUpdated - aUpdated
    })
  }, [plans])
  const sessionsErrorMessage =
    (sessionsError instanceof Error ? sessionsError.message : null) ||
    (organizerRoundsError instanceof Error ? organizerRoundsError.message : null)
  const plansErrorMessage =
    plansError instanceof Error ? plansError.message : null
  const loadErrorMessage =
    (roundsError instanceof Error ? roundsError.message : null) ||
    sessionsErrorMessage ||
    plansErrorMessage

  useEffect(() => {
    setPlanAnalysis(null)
    setPlanAnalysisError(null)
    setPlanRecap(null)
    setPlanRecapError(null)
  }, [selectedPlanId])

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

  useEffect(() => {
    setChatMessages([])
    setChatInput('')
    setChatError(null)
    setCachedAggregation(null)
    setCachedAggregationKey(selectionKey)
    setAggregatedPreview(null)
  }, [selectionKey])

  useEffect(() => {
    if (activePanel !== 'rounds' || selectedIds.size === 0) {
      setAggregatedPreview(null)
      return
    }

    let isActive = true
    setIsLoadingAggregation(true)
    getAggregatedData()
      .then((data) => {
        if (isActive) {
          setAggregatedPreview(data)
        }
      })
      .catch((err) => {
        const error = err as Error
        setError(error.message)
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingAggregation(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activePanel, selectionKey])

  useEffect(() => {
    if (activePanel !== 'plans' || !selectedPlanId) {
      setPlanRecap(null)
      return
    }

    let isActive = true
    setIsLoadingPlanRecap(true)
    setPlanRecapError(null)
    fetchDemocracyRoutesPlanRecapClient(selectedPlanId)
      .then((recap) => {
        if (isActive) {
          setPlanRecap(recap)
        }
      })
      .catch((err) => {
        const error = err as Error
        if (isActive) {
          setPlanRecapError(error.message)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlanRecap(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activePanel, selectedPlanId])


  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId)
    setIsLoadingPlanDetail(true)
    setPlanAnalysisError(null)

    try {
      const detail = await fetchDemocracyRoutesPlanClient(planId)
      setSelectedPlanDetail(detail)
    } catch (err) {
      const error = err as Error
      setPlanAnalysisError(error.message)
      setSelectedPlanDetail(null)
    } finally {
      setIsLoadingPlanDetail(false)
    }
  }

  const handleAnalyzePlan = async () => {
    if (!selectedPlanId) return

    setIsAnalyzingPlan(true)
    setPlanAnalysisError(null)

    try {
      const recap = planRecap ?? (await fetchDemocracyRoutesPlanRecapClient(selectedPlanId))
      const plan =
        selectedPlanDetail ?? (await fetchDemocracyRoutesPlanClient(selectedPlanId))

      const response = await fetch('/api/plan-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: {
            id: plan.id,
            title: plan.title,
            startAt: plan.startAt,
            timezone: plan.timezone ?? null,
            roundsCount: plan.roundsCount,
            roundDurationMinutes: plan.roundDurationMinutes,
            language: plan.language,
            transcriptionProvider: plan.transcriptionProvider
          },
          recap,
          prompt: planPrompt,
          provider: planProvider
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Plan analysis failed')
      }

      const result: PlanAnalysisResponse = await response.json()
      setPlanAnalysis(result)
    } catch (err) {
      const error = err as Error
      setPlanAnalysisError(error.message)
    } finally {
      setIsAnalyzingPlan(false)
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
        {(error ?? loadErrorMessage) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error ?? loadErrorMessage}</AlertDescription>
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
              <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  View
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={activePanel === "rounds" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActivePanel("rounds")}
                  >
                    Rounds
                  </Button>
                  <Button
                    type="button"
                    variant={activePanel === "plans" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActivePanel("plans")}
                  >
                    Plans
                  </Button>
                </div>
              </div>

              {activePanel === "rounds" ? (
              <SessionsPanel
                sessions={sessions}
                rounds={organizerRounds}
                activeDeepgramRoundIds={activeDeepgramRoundIds}
                activeVoskRoundIds={activeVoskRoundIds}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                isLoading={isLoadingSessions || isLoadingOrganizerRounds}
                error={sessionsErrorMessage}
              />
              ) : null}
              {activePanel === "rounds" ? (
                <RoundsTable
                  rounds={rounds}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />
              ) : null}
              {activePanel === "plans" ? (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Plans
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Browse Democracy Routes plans.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshPlans()}
                      disabled={isLoadingPlans}
                    >
                      {isLoadingPlans ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>

                  {plansErrorMessage && (
                    <p className="mt-3 text-sm text-destructive">{plansErrorMessage}</p>
                  )}
                  {planAnalysisError && (
                    <p className="mt-3 text-sm text-destructive">{planAnalysisError}</p>
                  )}

                  {isLoadingPlans ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading plans...
                    </div>
                  ) : plans.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">No plans available.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {sortedPlans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => handleSelectPlan(plan.id)}
                          className={`w-full rounded-xl border border-border/60 px-3 py-3 text-left text-sm transition ${
                            selectedPlanId === plan.id
                              ? 'bg-muted/60 text-foreground'
                              : 'bg-background/80 text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-foreground">{plan.title}</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              {plan.language}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(plan.startAt).toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {activePanel === "plans" ? (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Plan details
                  </p>
                  {isLoadingPlanDetail ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading plan...
                    </div>
                  ) : selectedPlanDetail ? (
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Title
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedPlanDetail.title}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Start
                          </p>
                          <p className="mt-1 text-foreground">
                            {new Date(selectedPlanDetail.startAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Timezone
                          </p>
                          <p className="mt-1 text-foreground">
                            {selectedPlanDetail.timezone || 'Local'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Rounds
                          </p>
                          <p className="mt-1 text-foreground">
                            {selectedPlanDetail.roundsCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Round duration
                          </p>
                          <p className="mt-1 text-foreground">
                            {selectedPlanDetail.roundDurationMinutes} min
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Language
                          </p>
                          <p className="mt-1 text-foreground">
                            {selectedPlanDetail.language}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Transcription
                          </p>
                          <p className="mt-1 text-foreground">
                            {selectedPlanDetail.transcriptionProvider}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Pairing overview
                        </p>
                        <p className="mt-1 text-foreground">
                          {selectedPlanDetail.rounds.reduce(
                            (sum, round) => sum + round.pairs.length,
                            0
                          )}{' '}
                          pairs across {selectedPlanDetail.rounds.length} rounds
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Select a plan to see details.
                    </p>
                  )}
                </div>
              ) : null}

              {activePanel === "rounds" ? (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Aggregated transcription
                    </p>
                    {isLoadingAggregation ? (
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    ) : null}
                  </div>
                  {aggregatedPreview ? (
                    <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto text-sm text-muted-foreground">
                      {aggregatedPreview.allContributions.map((contribution, index) => {
                        const speaker =
                          aggregatedPreview.allParticipants.find(
                            (participant) => participant.identifier === contribution.madeBy
                          )?.name || contribution.madeBy
                        return (
                          <div key={`${contribution.sourceRound}-${index}`} className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              {contribution.sourceRoundName} • {speaker}
                            </p>
                            <p className="text-foreground">{contribution.text}</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Select one or more rounds to preview the merged transcript.
                    </p>
                  )}
                </div>
              ) : null}

              {activePanel === "plans" ? (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Plan recap
                    </p>
                    {isLoadingPlanRecap ? (
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    ) : null}
                  </div>
                  {planRecapError ? (
                    <p className="mt-3 text-sm text-destructive">{planRecapError}</p>
                  ) : null}
                  {planRecap ? (
                    <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto text-sm text-muted-foreground">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Participants
                        </p>
                        <p className="mt-1 text-foreground">
                          {planRecap.participants.length
                            ? planRecap.participants.join(', ')
                            : 'No participants listed.'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Text entries
                        </p>
                        {planRecap.textEntries.length === 0 ? (
                          <p className="mt-1 text-muted-foreground">No text entries.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {planRecap.textEntries.map((entry) => (
                              <li key={`${entry.blockId}-${entry.userEmail}`} className="space-y-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  {entry.userEmail}
                                </p>
                                <p className="text-foreground">{entry.content}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Meditation transcripts
                        </p>
                        {planRecap.meditationSessions.length === 0 ? (
                          <p className="mt-1 text-muted-foreground">No meditation transcripts.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {planRecap.meditationSessions.map((session) => (
                              <li
                                key={`${session.meditationIndex}-${session.userEmail}`}
                                className="space-y-1"
                              >
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  Meditation {session.meditationIndex} • {session.userEmail}
                                </p>
                                <p className="text-foreground">{session.transcriptText}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Meeting transcripts
                        </p>
                        {planRecap.meetingTranscripts.length === 0 ? (
                          <p className="mt-1 text-muted-foreground">No meeting transcripts.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {planRecap.meetingTranscripts.map((meeting) => (
                              <li
                                key={`${meeting.meetingId}-${meeting.roundNumber}`}
                                className="space-y-1"
                              >
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  Round {meeting.roundNumber} • {meeting.participants.join(', ')}
                                </p>
                                <p className="text-foreground">{meeting.transcriptText}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Select a plan to preview the recap data.
                    </p>
                  )}
                </div>
              ) : null}
              </div>

              {/* Right column: Prompt editor and analysis */}
            <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-6 self-start">
              {activePanel === "rounds" ? (
                <PromptEditor value={prompt} onChange={setPrompt} />
              ) : null}

              {activePanel === "plans" ? (
                <PromptEditor value={planPrompt} onChange={setPlanPrompt} />
              ) : null}

              {activePanel === "rounds" ? (
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
              ) : null}

              {activePanel === "plans" ? (
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    AI Provider
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={planProvider === "gemini" ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setPlanProvider("gemini")}
                    >
                      Gemini
                    </Button>
                    <Button
                      type="button"
                      variant={planProvider === "ollama" ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setPlanProvider("ollama")}
                    >
                      Ollama
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Analyze button */}
                {activePanel === "rounds" ? (
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
                ) : null}

                {activePanel === "plans" ? (
                  <Button
                    onClick={handleAnalyzePlan}
                    disabled={!selectedPlanId || isAnalyzingPlan || !planPrompt.trim()}
                    size="lg"
                    className="w-full"
                  >
                    {isAnalyzingPlan ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Run Plan Analysis
                      </>
                    )}
                  </Button>
                ) : null}

                {/* Info message when no rounds selected */}
                {activePanel === "rounds" && selectedIds.size === 0 && !isAnalyzing && (
                  <Alert>
                    <AlertDescription>
                      Select one or more completed rounds from the table to begin analysis.
                    </AlertDescription>
                  </Alert>
                )}
                {activePanel === "plans" && !selectedPlanId && !isAnalyzingPlan && (
                  <Alert>
                    <AlertDescription>
                      Select a plan to analyze its recap data.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {activePanel === "rounds" ? (
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
            ) : null}

            {activePanel === "plans" ? (
              <div className="mt-10 grid gap-6">
                {planAnalysis ? (
                  <ResultsDisplay
                    analysis={planAnalysis.analysis}
                    metadata={{
                      roundsAnalyzed: selectedPlanDetail?.roundsCount ?? 0,
                      timestamp: planAnalysis.timestamp,
                      model: planAnalysis.metadata?.model
                    }}
                    onClear={() => setPlanAnalysis(null)}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
                    Run a plan analysis to see a structured report.
                  </div>
                )}
              </div>
            ) : null}
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
