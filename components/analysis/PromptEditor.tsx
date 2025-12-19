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
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis Prompt</CardTitle>
        <CardDescription>
          Customize what you want Gemini AI to analyze in the selected rounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick select buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Prompts:</label>
          <div className="flex flex-wrap gap-2">
            {promptOptions.map(([key, promptText]) => (
              <Button
                key={key}
                variant={value === promptText ? "default" : "outline"}
                size="sm"
                onClick={() => onChange(promptText)}
                title={PROMPT_DESCRIPTIONS[key as keyof typeof PROMPT_DESCRIPTIONS]}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom prompt textarea */}
        <div className="space-y-2">
          <label htmlFor="custom-prompt" className="text-sm font-medium">
            Custom Prompt:
          </label>
          <Textarea
            id="custom-prompt"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your custom analysis prompt..."
            className="min-h-[120px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            The AI will analyze all selected rounds based on this prompt
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
