export interface Session {
  id: string
  name: string
  created_at: string
  round_count?: number
  extra_privacy?: boolean
}
