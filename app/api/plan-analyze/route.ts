/**
 * API route for AI analysis of Democracy Routes plan recaps
 * POST /api/plan-analyze
 */

import { NextRequest, NextResponse } from "next/server"
import { analyzePlanWithGemini, analyzePlanWithOllama } from "@/lib/api/plan-analysis"
import { PlanAnalysisRequest, PlanAnalysisResponse } from "@/types/plan-analysis"
import { createRequestId, logError, logInfo, logWarn } from "@/lib/logger"

export const dynamic = "force-dynamic"

function requiresApiKey(request: NextRequest) {
  const expected = process.env.ANALYZE_TABLES_API_KEY
  if (!expected) return null
  const provided = request.headers.get("x-api-key")
  if (!provided || provided !== expected) {
    const origin = request.headers.get("origin") || ""
    const host = request.headers.get("host") || ""
    const fetchSite = request.headers.get("sec-fetch-site") || ""
    if (fetchSite === "same-origin" || origin.includes(host)) {
      return null
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId()
  const authError = requiresApiKey(request)
  if (authError) return authError

  try {
    const body: PlanAnalysisRequest = await request.json()
    const { plan, recap, prompt, provider } = body
    const startTime = Date.now()

    if (!plan || !recap || !prompt) {
      logError("plan-analyze.validation_error", { requestId, missing: true })
      return NextResponse.json(
        { error: "Missing required fields: plan, recap, prompt" },
        { status: 400 }
      )
    }

    if (
      (!recap.textEntries || recap.textEntries.length === 0) &&
      (!recap.meditationSessions || recap.meditationSessions.length === 0) &&
      (!recap.meetingTranscripts || recap.meetingTranscripts.length === 0)
    ) {
      logError("plan-analyze.validation_error", { requestId, emptyRecap: true })
      return NextResponse.json(
        { error: "No recap content provided for analysis" },
        { status: 400 }
      )
    }

    const selectedProvider = provider === "ollama" ? "ollama" : "gemini"
    logInfo("plan-analyze.request", {
      requestId,
      planId: plan.id,
      provider: selectedProvider
    })
    const analysis =
      selectedProvider === "ollama"
        ? await analyzePlanWithOllama(body)
        : await analyzePlanWithGemini(body)

    const response: PlanAnalysisResponse = {
      planId: plan.id,
      analysis,
      timestamp: new Date().toISOString(),
      metadata: {
        model: selectedProvider === "ollama"
          ? (process.env.OLLAMA_MODEL || "ollama")
          : "gemini-2.5-flash"
      }
    }

    const webhookBaseUrl =
      process.env.DEMOCRACY_ROUTES_ANALYSIS_WEBHOOK_URL ||
      process.env.DEMOCRACY_ROUTES_API_URL
    if (webhookBaseUrl) {
      const apiKey = process.env.ANALYZE_TABLES_API_KEY
      const normalizedBase = webhookBaseUrl.replace(/\/$/, "")
      const baseWithPath = normalizedBase.includes("/api/integrations/analyze/plans")
        ? normalizedBase
        : `${normalizedBase}/api/integrations/analyze/plans`
      const webhookUrl = `${baseWithPath}/${plan.id}/analysis`
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {})
          },
          body: JSON.stringify({
            planId: plan.id,
            analysis,
            prompt,
            provider: selectedProvider,
            createdAt: response.timestamp,
            metadata: response.metadata
          })
        })
        logInfo("plan-analyze.webhook_ok", { requestId, planId: plan.id })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        logWarn("plan-analyze.webhook_failed", { requestId, planId: plan.id, message })
      }
    }

    logInfo("plan-analyze.response_ok", {
      requestId,
      planId: plan.id,
      durationMs: Date.now() - startTime
    })
    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    logError("plan-analyze.exception", { requestId, message })
    return NextResponse.json(
      { error: "Failed to analyze plan recap", details: message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to analyze plan recaps." },
    { status: 405 }
  )
}
