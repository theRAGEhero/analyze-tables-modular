// Round entity type definitions

export interface Round {
  id: string;
  source?: "deepgram" | "vosk";
  sourceId?: string;
  name: string;
  description?: string;
  created_at: string;
  status: RoundStatus;
  audio_file?: string;
  transcription_file?: string;
  duration_seconds?: number;
  speaker_count?: number;
}

export enum RoundStatus {
  CREATED = "created",
  RECORDING = "recording",
  STREAMING = "streaming",
  PROCESSING = "processing",
  COMPLETED = "completed",
  ERROR = "error"
}

export interface CreateRoundInput {
  name: string;
  description?: string;
}
