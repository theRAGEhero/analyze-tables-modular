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
      case RoundStatus.ERROR:
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Rounds</CardTitle>
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Speakers</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedRounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(round.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRound(round.id, checked as boolean)
                        }
                        aria-label={`Select ${round.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{round.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
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
