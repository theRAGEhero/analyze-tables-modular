"use client"

import React from 'react'
import { Round, RoundStatus } from '@/types/round'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key } from 'lucide-react'

interface RoundsTableProps {
  rounds: Round[]
  selectedIds: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
}

export function RoundsTable({ rounds, selectedIds, onSelectionChange }: RoundsTableProps) {
  const completedRounds = rounds.filter(r => r.status === RoundStatus.COMPLETED)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(completedRounds.map(r => r.id)))
    } else {
      onSelectionChange(new Set())
    }
  }

  const handleSelectRound = (roundId: string, checked: boolean) => {
    const newSelection = new Set(selectedIds)
    if (checked) {
      newSelection.add(roundId)
    } else {
      newSelection.delete(roundId)
    }
    onSelectionChange(newSelection)
  }

  const allSelected = completedRounds.length > 0 &&
    completedRounds.every(r => selectedIds.has(r.id))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusVariant = (status: RoundStatus) => {
    switch (status) {
      case RoundStatus.COMPLETED:
        return 'default'
      case RoundStatus.PROCESSING:
        return 'secondary'
      case RoundStatus.STREAMING:
        return 'secondary'
      case RoundStatus.ERROR:
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl">Available Rounds</CardTitle>
        <CardDescription>
          Select rounds to analyze. {selectedIds.size > 0 && (
            <span className="font-semibold text-foreground">
              {selectedIds.size} round{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No rounds available. Create a round in the Deepgram-modular platform first.
          </p>
        ) : completedRounds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No completed rounds available for analysis.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/70">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Speakers
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Duration
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedRounds.map((round) => (
                  <TableRow key={round.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(round.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRound(round.id, checked as boolean)
                        }
                        aria-label={`Select ${round.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{round.name}</div>
                        {round.source === 'vosk' && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] tracking-[0.12em] text-muted-foreground">
                            <Key className="h-3 w-3 text-muted-foreground" />
                            Vosk locally transcribed
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[200px] truncate"
                      title={round.description || '-'}
                    >
                      {round.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(round.status)}>
                        {round.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{round.speaker_count || '-'}</TableCell>
                    <TableCell>{formatDuration(round.duration_seconds)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(round.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
