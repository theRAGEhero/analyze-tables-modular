"use client"

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_PROMPTS, PROMPT_DESCRIPTIONS } from '@/lib/prompts/analysis-prompts'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
}

export function PromptEditor({ value, onChange }: PromptEditorProps) {
  const promptOptions = Object.entries(DEFAULT_PROMPTS) as [string, string][]

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl">Analysis Prompt</CardTitle>
        <CardDescription>
          Shape the AI focus and guide the highlights you want to see.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Quick select buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quick prompts
          </label>
          <div className="flex flex-wrap gap-2">
            {promptOptions.map(([key, promptText]) => (
              <Button
                key={key}
                variant={value === promptText ? "default" : "secondary"}
                size="sm"
                onClick={() => onChange(promptText)}
                title={PROMPT_DESCRIPTIONS[key as keyof typeof PROMPT_DESCRIPTIONS]}
                className="rounded-full px-4"
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom prompt textarea */}
        <div className="space-y-2">
          <label htmlFor="custom-prompt" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Custom prompt
          </label>
          <Textarea
            id="custom-prompt"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your custom analysis prompt..."
            className="min-h-[140px] resize-y bg-background/80"
          />
          <p className="text-xs text-muted-foreground">
            The AI will analyze all selected rounds based on this prompt
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
