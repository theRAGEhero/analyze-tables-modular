"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Copy, Download } from 'lucide-react'

interface ResultsDisplayProps {
  analysis: string
  metadata: {
    roundsAnalyzed: number
    timestamp: string
    model?: string
  }
  onClear: () => void
}

export function ResultsDisplay({ analysis, metadata, onClear }: ResultsDisplayProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysis)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([analysis], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-analysis-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>AI Analysis Results</CardTitle>
            <CardDescription>
              Analyzed {metadata.roundsAnalyzed} round{metadata.roundsAnalyzed !== 1 ? 's' : ''} • {formatDate(metadata.timestamp)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {metadata.model && (
              <Badge variant="secondary" className="text-xs">
                {metadata.model}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              title="Clear results"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Analysis content */}
        <div className="rounded-lg bg-muted p-4">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
            {analysis}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

// Import Check icon
function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
