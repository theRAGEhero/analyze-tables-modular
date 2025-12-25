"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Key } from 'lucide-react'
import { Session } from '@/types/session'
import { OrganizerRound } from '@/types/organizer-round'

interface SessionsPanelProps {
  sessions: Session[]
  rounds: OrganizerRound[]
  activeDeepgramRoundIds: Set<string>
  activeVoskRoundIds: Set<string>
  selectedIds: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
  isLoading: boolean
  error?: string | null
}

export function SessionsPanel({
  sessions,
  rounds,
  activeDeepgramRoundIds,
  activeVoskRoundIds,
  selectedIds,
  onSelectionChange,
  isLoading,
  error
}: SessionsPanelProps) {
  const [openSessions, setOpenSessions] = React.useState<Set<string>>(new Set())

  const roundsBySession = React.useMemo(() => {
    const map = new Map<string, OrganizerRound[]>()
    rounds.forEach((round) => {
      if (!round.session_id) return
      if (!map.has(round.session_id)) {
        map.set(round.session_id, [])
      }
      map.get(round.session_id)!.push(round)
    })
    return map
  }, [rounds])

  const toggleSessionOpen = (sessionId: string) => {
    setOpenSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const getSelectionPrefix = (session: Session) =>
    session.extra_privacy ? 'vosk' : 'deepgram'

  const getActiveRoundIds = (session: Session) =>
    session.extra_privacy ? activeVoskRoundIds : activeDeepgramRoundIds

  const toSelectionId = (session: Session, roundId: string) =>
    `${getSelectionPrefix(session)}:${roundId}`

  const handleSessionToggle = (session: Session, checked: boolean) => {
    const sessionRounds = roundsBySession.get(session.id) || []
    const activeRoundIds = getActiveRoundIds(session)
    const activeSessionRounds = sessionRounds.filter((round) =>
      activeRoundIds.has(toSelectionId(session, round.id))
    )
    const nextSelection = new Set(selectedIds)

    if (checked) {
      activeSessionRounds.forEach((round) => nextSelection.add(toSelectionId(session, round.id)))
    } else {
      activeSessionRounds.forEach((round) => nextSelection.delete(toSelectionId(session, round.id)))
    }

    onSelectionChange(nextSelection)
  }

  const handleRoundToggle = (session: Session, roundId: string, checked: boolean) => {
    const selectionId = toSelectionId(session, roundId)
    const nextSelection = new Set(selectedIds)
    if (checked) {
      nextSelection.add(selectionId)
    } else {
      nextSelection.delete(selectionId)
    }
    onSelectionChange(nextSelection)
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl">Sessions</CardTitle>
        <CardDescription>
          Select a session to include all recorded rounds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Recorded (active)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span>Not recorded</span>
          </div>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions available.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const sessionRounds = roundsBySession.get(session.id) || []
              const activeRoundIds = getActiveRoundIds(session)
              const activeSessionRounds = sessionRounds.filter((round) =>
                activeRoundIds.has(toSelectionId(session, round.id))
              )
              const activeSelectedCount = activeSessionRounds.filter((round) =>
                selectedIds.has(toSelectionId(session, round.id))
              ).length
              const isOpen = openSessions.has(session.id)

              const hasActiveRounds = activeSessionRounds.length > 0
              const sessionChecked = hasActiveRounds && activeSelectedCount === activeSessionRounds.length
              const sessionIndeterminate =
                activeSelectedCount > 0 && activeSelectedCount < activeSessionRounds.length

              return (
                <div key={session.id} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={sessionIndeterminate ? 'indeterminate' : sessionChecked}
                        onCheckedChange={(checked) =>
                          handleSessionToggle(session, Boolean(checked))
                        }
                        disabled={!hasActiveRounds}
                        aria-label={`Select session ${session.name}`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{session.name}</p>
                        {session.extra_privacy && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] tracking-[0.12em] text-muted-foreground">
                            <Key className="h-3 w-3 text-muted-foreground" />
                            Vosk locally transcribed
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {sessionRounds.length} round{sessionRounds.length !== 1 ? 's' : ''} •{' '}
                          {activeSessionRounds.length} recorded
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {session.round_count ?? sessionRounds.length} total
                      </Badge>
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                        onClick={() => toggleSessionOpen(session.id)}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? 'Hide rounds' : 'Show rounds'}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <>
                      {sessionRounds.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {sessionRounds.map((round) => {
                        const isActive = activeRoundIds.has(toSelectionId(session, round.id))
                        return (
                          <div
                            key={round.id}
                            className={`flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-sm ${
                              isActive ? 'bg-background/80' : 'bg-muted/40 text-muted-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedIds.has(toSelectionId(session, round.id))}
                                onCheckedChange={(checked) =>
                                  handleRoundToggle(session, round.id, Boolean(checked))
                                }
                                disabled={!isActive}
                                aria-label={`Select round ${round.name}`}
                              />
                                  <span className={`${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {round.name}
                                  </span>
                                </div>
                                {!isActive && (
                                  <span className="text-xs uppercase tracking-[0.2em]">
                                    no recording
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">No rounds created yet.</p>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
