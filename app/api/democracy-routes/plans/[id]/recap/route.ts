/**
 * Proxy route to fetch plan recap from Democracy Routes workflow API
 * GET /api/democracy-routes/plans/[id]/recap
 */

import { NextRequest, NextResponse } from "next/server"
import { createRequestId, logError, logInfo } from "@/lib/logger"

const DEFAULT_BASE_URL = "http://localhost:3015"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = createRequestId()
  try {
    const baseUrl = process.env.DEMOCRACY_ROUTES_API_URL || DEFAULT_BASE_URL
    const workflowKey = process.env.DEMOCRACY_ROUTES_WORKFLOW_API_KEY

    logInfo("democracy-routes.plan_recap.request", {
      requestId,
      planId: params.id,
      baseUrl,
      hasKey: Boolean(workflowKey)
    })

    const response = await fetch(
      `${baseUrl}/api/integrations/workflow/plans/${params.id}/recap`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(workflowKey ? { "x-api-key": workflowKey } : {})
        },
        cache: "no-store"
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logError("democracy-routes.plan_recap.response_error", {
        requestId,
        status: response.status,
        error: errorData
      })
      return NextResponse.json(
        { error: "Failed to fetch Democracy Routes plan recap", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    logInfo("democracy-routes.plan_recap.response_ok", { requestId, planId: params.id })
    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    logError("democracy-routes.plan_recap.exception", { requestId, message })
    return NextResponse.json(
      { error: "Failed to fetch Democracy Routes plan recap", details: message },
      { status: 500 }
    )
  }
}
