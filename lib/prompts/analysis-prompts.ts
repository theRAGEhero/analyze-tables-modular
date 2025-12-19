/**
 * Default prompts for AI analysis
 */

export const DEFAULT_PROMPTS = {
  conflicts: "Find points of conflicts and agreement in these deliberation transcriptions.",
  summary: "Provide a comprehensive summary of the main topics discussed across all deliberations.",
  sentiment: "Analyze the overall sentiment and emotional tone of the deliberations.",
  themes: "Identify recurring themes and patterns across the discussions.",
  decisions: "Identify key decisions made and action items proposed during the deliberations.",
  participation: "Analyze participation patterns and speaking time distribution among participants."
}

export const DEFAULT_PROMPT = DEFAULT_PROMPTS.conflicts

export const PROMPT_DESCRIPTIONS = {
  conflicts: "Identifies areas of disagreement and consensus",
  summary: "Provides an overview of all discussions",
  sentiment: "Analyzes emotional tone and attitudes",
  themes: "Finds recurring topics and patterns",
  decisions: "Extracts actionable outcomes",
  participation: "Examines speaking patterns"
}
