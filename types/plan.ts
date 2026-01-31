export type WorkflowPlanSummary = {
  id: string
  title: string
  dataspaceId: string | null
  startAt: string
  timezone: string | null
  roundsCount: number
  roundDurationMinutes: number
  language: string
  transcriptionProvider: string
  createdAt: string
  updatedAt: string
}

export type WorkflowPlanPair = {
  roomId: string
  userAId: string
  userBId: string | null
  meetingId: string | null
}

export type WorkflowPlanRound = {
  roundNumber: number
  pairs: WorkflowPlanPair[]
}

export type WorkflowPlanDetail = WorkflowPlanSummary & {
  rounds: WorkflowPlanRound[]
}
