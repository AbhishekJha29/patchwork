import crypto from "crypto";

export interface ParsedStackFrame {
  filePath: string;
  lineNumber: number;
  functionName: string;
  order: number;
}

/**
 * Parses raw stack trace string into structured StackFrame entries.
 */
export function parseStackTrace(stack?: string): ParsedStackFrame[] {
  if (!stack || typeof stack !== "string") {
    return [];
  }

  const lines = stack.split("\n");
  const frames: ParsedStackFrame[] = [];
  let order = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: "at functionName (filePath:line:column)" or "at async functionName (filePath:line:column)"
    const match1 = trimmed.match(/^at\s+(?:async\s+)?(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
    if (match1) {
      frames.push({
        functionName: match1[1].trim(),
        filePath: match1[2].trim(),
        lineNumber: parseInt(match1[3], 10),
        order: order++,
      });
      continue;
    }

    // Pattern 2: "at filePath:line:column" or "at async filePath:line:column"
    const match2 = trimmed.match(/^at\s+(?:async\s+)?(.+?):(\d+):(\d+)$/);
    if (match2) {
      frames.push({
        functionName: "<anonymous>",
        filePath: match2[1].trim(),
        lineNumber: parseInt(match2[2], 10),
        order: order++,
      });
      continue;
    }

    // Pattern 3: "functionName@filePath:line:column" (Safari/Firefox style)
    const match3 = trimmed.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
    if (match3) {
      frames.push({
        functionName: match3[1].trim() || "<anonymous>",
        filePath: match3[2].trim(),
        lineNumber: parseInt(match3[3], 10),
        order: order++,
      });
      continue;
    }
  }

  return frames;
}

/**
 * Generates a SHA-256 fingerprint hash based on the error message and top N stack frames (ignoring line numbers).
 */
export function generateFingerprint(
  errorMessage: string,
  frames: ParsedStackFrame[],
  topN: number = 5
): string {
  const topFrames = frames.slice(0, topN);
  const frameSignature = topFrames
    .map((f) => `${f.filePath}:${f.functionName}`)
    .join("|");

  const rawString = `${errorMessage.trim()}::${frameSignature}`;

  return crypto.createHash("sha256").update(rawString).digest("hex");
}
