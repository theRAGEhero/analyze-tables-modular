type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
const LOG_JSON = process.env.LOG_JSON === "true";
const LOG_FILE = process.env.LOG_FILE;

function shouldLog(level: LogLevel) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[LOG_LEVEL];
}

async function writeLog(line: string) {
  if (!LOG_FILE) return;
  try {
    const fs = await import("node:fs/promises");
    await fs.appendFile(LOG_FILE, `${line}\n`);
  } catch {
    // Fallback to console only.
  }
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LOG_JSON) {
    return JSON.stringify({
      level,
      message,
      ...meta
    });
  }
  const metaText = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${level.toUpperCase()}] ${message}${metaText}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const line = formatMessage(level, message, meta);

  switch (level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
    default:
      console.log(line);
  }

  void writeLog(line);
}

export function logDebug(message: string, meta?: Record<string, unknown>) {
  log("debug", message, meta);
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  log("info", message, meta);
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  log("warn", message, meta);
}

export function logError(message: string, meta?: Record<string, unknown>) {
  log("error", message, meta);
}

export function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}
