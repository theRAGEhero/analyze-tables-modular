"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatMessage } from '@/types/analysis'

interface ChatPanelProps {
  messages: ChatMessage[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onClear: () => void
  isSending: boolean
  disabled: boolean
  error?: string | null
}

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onClear,
  isSending,
  disabled,
  error
}: ChatPanelProps) {
  const endRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!disabled && input.trim() && !isSending) {
        onSend()
      }
    }
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl">Chat Companion</CardTitle>
            <CardDescription>
              Ask questions about the selected transcripts and insights.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-72 overflow-y-auto rounded-xl border border-border/60 bg-background/70 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Ask a question to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-background/90 text-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Select rounds to enable chat...' : 'Ask a question...'}
            disabled={disabled || isSending}
            className="min-h-[90px] bg-background/80"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for a new line.
            </p>
            <Button
              onClick={onSend}
              disabled={disabled || isSending || !input.trim()}
              size="sm"
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
