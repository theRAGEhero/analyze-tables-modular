"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
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

  const markdownComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="font-display text-lg font-semibold" {...props} />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="font-display text-base font-semibold" {...props} />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="font-display text-sm font-semibold" {...props} />
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="text-sm leading-relaxed" {...props} />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc space-y-1 pl-5 text-sm" {...props} />
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal space-y-1 pl-5 text-sm" {...props} />
    ),
    li: (props: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="leading-relaxed" {...props} />
    ),
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        className="text-sm text-primary underline underline-offset-2"
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    ),
    blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="border-l-2 border-muted-foreground/40 pl-3 text-sm text-muted-foreground" {...props} />
    ),
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
      <pre className="overflow-x-auto rounded-md bg-muted/70 p-3 text-xs" {...props} />
    ),
    code: ({
      className,
      inline,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
      inline ? (
        <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props} />
      ) : (
        <code className={`text-xs ${className ?? ''}`} {...props} />
      )
  }

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
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl">Analysis Results</CardTitle>
            <CardDescription>
              Analyzed {metadata.roundsAnalyzed} round{metadata.roundsAnalyzed !== 1 ? 's' : ''} • {formatDate(metadata.timestamp)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {metadata.model && (
              <Badge variant="secondary" className="text-xs">
                {metadata.model}
              </Badge>
            )}
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
        {/* Analysis content */}
        <div className="rounded-xl bg-background/80 p-4">
          <div className="space-y-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={markdownComponents}
            >
              {analysis}
            </ReactMarkdown>
          </div>
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
