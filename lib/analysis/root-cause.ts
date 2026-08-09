import { db } from "@/lib/db";
import { generateText } from "@/lib/ai/gemini-client";
import {
  parseOwnerRepo,
  getRecentCommits,
  getCommitDiff,
  GitHubCommitData,
} from "@/lib/github/client";

export interface StackFrameInput {
  filePath: string;
  lineNumber: number;
  functionName: string;
}

export interface AnalyzeRootCauseInput {
  incidentId: string;
  errorMessage: string;
  stackFrames: StackFrameInput[];
  projectRepoUrl: string;
}

export interface RootCauseAnalysisResult {
  success: boolean;
  culpritCommitHash: string | null;
  confidenceScore: number;
  reasoning: string;
  commitId?: string;
  skippedReason?: string;
}

/**
 * Calculates a file-path overlap score between stack frame file paths and commit changed files.
 */
function calculateOverlapScore(
  stackFramePaths: string[],
  commitFiles: string[]
): number {
  if (!stackFramePaths.length || !commitFiles.length) return 0;

  let score = 0;

  for (const rawFramePath of stackFramePaths) {
    const framePath = rawFramePath.replace(/^[\.\/\\]+/, "").toLowerCase();
    const frameBasename = framePath.split(/[\/\\]/).pop() || "";

    for (const rawCommitFile of commitFiles) {
      const commitFile = rawCommitFile.replace(/^[\.\/\\]+/, "").toLowerCase();
      const commitBasename = commitFile.split(/[\/\\]/).pop() || "";

      if (commitFile === framePath || commitFile.endsWith(framePath) || framePath.endsWith(commitFile)) {
        score += 3;
      } else if (frameBasename && commitBasename && frameBasename === commitBasename) {
        score += 1;
      }
    }
  }

  return score;
}

export async function analyzeRootCause({
  incidentId,
  errorMessage,
  stackFrames,
  projectRepoUrl,
}: AnalyzeRootCauseInput): Promise<RootCauseAnalysisResult> {
  // Add AuditLog: Analysis started
  try {
    await db.auditLog.create({
      data: {
        incidentId,
        type: "ROOT_CAUSE_START",
        message: "Root cause analysis started",
      },
    });
  } catch (logErr) {
    console.warn("Failed to create start audit log:", logErr);
  }

  // 1. Check GITHUB_TOKEN
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === "your-github-personal-access-token-here") {
    const skipMsg = "Root cause analysis skipped: GITHUB_TOKEN is not configured.";
    console.warn(`[Root Cause Analysis] ${skipMsg}`);
    await db.auditLog.create({
      data: {
        incidentId,
        type: "ROOT_CAUSE_SKIPPED",
        message: "Root cause analysis skipped: no repo access",
      },
    });
    return {
      success: false,
      culpritCommitHash: null,
      confidenceScore: 0,
      reasoning: skipMsg,
      skippedReason: "NO_GITHUB_TOKEN",
    };
  }

  // 2. Parse owner and repo
  const parsedRepo = parseOwnerRepo(projectRepoUrl);
  if (!parsedRepo) {
    const skipMsg = `Root cause analysis skipped: Invalid repository format "${projectRepoUrl}".`;
    console.warn(`[Root Cause Analysis] ${skipMsg}`);
    await db.auditLog.create({
      data: {
        incidentId,
        type: "ROOT_CAUSE_SKIPPED",
        message: "Root cause analysis skipped: invalid repo format",
      },
    });
    return {
      success: false,
      culpritCommitHash: null,
      confidenceScore: 0,
      reasoning: skipMsg,
      skippedReason: "INVALID_REPO_URL",
    };
  }

  const { owner, repo } = parsedRepo;

  // 3. Fetch recent commits (limit = 20)
  const recentCommits = await getRecentCommits(owner, repo, 20);

  if (!recentCommits || recentCommits.length === 0) {
    const skipMsg = `Root cause analysis inconclusive: Unable to fetch commits for ${owner}/${repo} or repository is empty.`;
    console.warn(`[Root Cause Analysis] ${skipMsg}`);
    await db.auditLog.create({
      data: {
        incidentId,
        type: "ROOT_CAUSE_INCONCLUSIVE",
        message: "Root cause analysis inconclusive",
      },
    });
    return {
      success: false,
      culpritCommitHash: null,
      confidenceScore: 0,
      reasoning: skipMsg,
      skippedReason: "NO_COMMITS_FOUND",
    };
  }

  // 4. Pre-filter and rank candidate commits by file path overlap
  const stackPaths = stackFrames.map((sf) => sf.filePath).filter(Boolean);

  const rankedCommits = recentCommits
    .map((c) => ({
      commit: c,
      score: calculateOverlapScore(stackPaths, c.filesChanged),
    }))
    .sort((a, b) => b.score - a.score);

  // Take top 5 candidates
  const topCandidates = rankedCommits.slice(0, 5).map((item) => item.commit);

  // 5. Fetch diffs for the top candidate commits
  const candidatesWithDiffs = await Promise.all(
    topCandidates.map(async (c) => {
      const diffData = await getCommitDiff(owner, repo, c.hash);
      // Limit diff snippet length to ~3000 chars per commit to save prompt tokens
      const fullDiff = diffData?.diff || "";
      const truncatedDiff = fullDiff.length > 3000 ? fullDiff.slice(0, 3000) + "\n... [diff truncated]" : fullDiff;
      return {
        ...c,
        diff: truncatedDiff,
      };
    })
  );

  // 6. Build Gemini Prompt
  const formattedStack = stackFrames.length > 0
    ? stackFrames.map((sf) => `  at ${sf.functionName} (${sf.filePath}:${sf.lineNumber})`).join("\n")
    : "  (No stack trace available)";

  const formattedCandidatesPrompt = candidatesWithDiffs
    .map(
      (c, idx) => `
Candidate Commit #${idx + 1}:
- Hash: ${c.hash}
- Author: ${c.author}
- Date: ${c.timestamp}
- Commit Message: ${c.message}
- Files Changed: ${c.filesChanged.join(", ") || "None listed"}
- Diff Snippet:
${c.diff || "(No diff available)"}
`
    )
    .join("\n----------------------------------------\n");

  const prompt = `You are a principal software engineer and automated incident analysis agent.
Analyze the following production incident report alongside candidate git commits to identify the root cause culprit commit.

INCIDENT DETAILS:
- Error Message: ${errorMessage}
- Stack Trace:
${formattedStack}

CANDIDATE RECENT COMMITS:
${formattedCandidatesPrompt}

INSTRUCTIONS:
1. Examine the candidate commits, their commit messages, changed files, and code diff snippets against the error message and stack trace.
2. Identify which commit introduced or triggered the bug/regression, if any.
3. If one candidate commit modified lines/files directly implicated in the stack trace or error logic, select it as the culprit commit.
4. If NONE of the candidate commits are responsible or there is insufficient evidence, return "culpritCommitHash": null with reasoning explaining why.
5. Provide a confidence score (0-100).

RESPONSE FORMAT INSTRUCTIONS:
Respond ONLY with a valid JSON object. Do NOT wrap in markdown \`\`\`json blocks. Do NOT include preamble or trailing text.
Required JSON schema:
{
  "culpritCommitHash": "commit_hash_string" | null,
  "confidenceScore": 85,
  "reasoning": "Clear explanation of why this commit is identified as the culprit or why analysis is inconclusive, referencing specific files/lines."
}
`;

  let culpritHash: string | null = null;
  let confidenceScore = 0;
  let reasoning = "Root cause analysis completed.";

  try {
    const rawOutput = await generateText(prompt);
    let cleanedJson = rawOutput.trim();
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    const parsed = JSON.parse(cleanedJson);

    if (typeof parsed.culpritCommitHash === "string" && parsed.culpritCommitHash.trim()) {
      culpritHash = parsed.culpritCommitHash.trim();
    }

    if (typeof parsed.confidenceScore === "number") {
      confidenceScore = Math.min(100, Math.max(0, Math.round(parsed.confidenceScore)));
    }

    if (typeof parsed.reasoning === "string" && parsed.reasoning.trim()) {
      reasoning = parsed.reasoning.trim();
    }
  } catch (aiErr: any) {
    console.error("[Root Cause Analysis] Gemini API call or JSON parse error:", aiErr?.message || aiErr);
    reasoning = "AI analysis encountered an error evaluating commit diffs.";
  }

  // 7. Store candidate commits in database and set Incident.rootCauseCommitId if culprit found
  let winningCommitDbId: string | undefined = undefined;

  try {
    for (const cand of candidatesWithDiffs) {
      const isCulprit = culpritHash && (cand.hash.toLowerCase().startsWith(culpritHash.toLowerCase()) || culpritHash.toLowerCase().startsWith(cand.hash.toLowerCase()));

      const createdCommit = await db.commit.create({
        data: {
          incidentId,
          hash: cand.hash,
          author: cand.author,
          message: cand.message,
          timestamp: new Date(cand.timestamp),
          confidenceScore: isCulprit ? confidenceScore : null,
          reasoning: isCulprit ? reasoning : null,
        },
      });

      if (isCulprit) {
        winningCommitDbId = createdCommit.id;
        culpritHash = cand.hash; // Standardize full hash
      }
    }

    if (winningCommitDbId) {
      await db.incident.update({
        where: { id: incidentId },
        data: {
          rootCauseCommitId: winningCommitDbId,
        },
      });

      const shortHash = culpritHash ? culpritHash.slice(0, 7) : "unknown";
      await db.auditLog.create({
        data: {
          incidentId,
          type: "ROOT_CAUSE_IDENTIFIED",
          message: `Root cause identified: commit ${shortHash}`,
        },
      });
    } else {
      await db.auditLog.create({
        data: {
          incidentId,
          type: "ROOT_CAUSE_INCONCLUSIVE",
          message: "Root cause analysis inconclusive",
        },
      });
    }

    // Transition incident status to ANALYZING via workflow manager
    try {
      const { transitionIncident } = await import("@/lib/workflow/status");
      await transitionIncident(incidentId, "ANALYZING", "system");
    } catch (transErr) {
      console.warn(`[Root Cause Analysis] Transition to ANALYZING skipped/error:`, transErr);
    }
  } catch (dbErr: any) {
    console.error("[Root Cause Analysis] Failed saving commit records to DB:", dbErr?.message || dbErr);
  }

  return {
    success: !!winningCommitDbId,
    culpritCommitHash: culpritHash,
    confidenceScore,
    reasoning,
    commitId: winningCommitDbId,
  };
}
