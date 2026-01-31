/**
 * Proxy route to fetch plans from Democracy Routes workflow API
 * GET /api/democracy-routes/plans
 */

import { NextRequest, NextResponse } from "next/server";
import { createRequestId, logError, logInfo } from "@/lib/logger";

const DEFAULT_BASE_URL = "http://localhost:3015";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = createRequestId();
  try {
    const baseUrl = process.env.DEMOCRACY_ROUTES_API_URL || DEFAULT_BASE_URL;
    const workflowKey = process.env.DEMOCRACY_ROUTES_WORKFLOW_API_KEY;
    const { search } = new URL(request.url);

    logInfo("democracy-routes.plans.request", {
      requestId,
      baseUrl,
      hasKey: Boolean(workflowKey),
      search
    });

    const response = await fetch(
      `${baseUrl}/api/integrations/workflow/plans${search}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(workflowKey ? { "x-api-key": workflowKey } : {})
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logError("democracy-routes.plans.response_error", {
        requestId,
        status: response.status,
        error: errorData
      });
      return NextResponse.json(
        { error: "Failed to fetch Democracy Routes plans", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    logInfo("democracy-routes.plans.response_ok", {
      requestId,
      count: Array.isArray(data?.plans) ? data.plans.length : null
    });
    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("democracy-routes.plans.exception", { requestId, message });
    return NextResponse.json(
      { error: "Failed to fetch Democracy Routes plans", details: message },
      { status: 500 }
    );
  }
}
