import { generateText } from "@/lib/ai/gemini-client";
import { getFileContent, parseOwnerRepo } from "@/lib/github/client";

export interface StackFrameInput {
  filePath: string;
  lineNumber: number;
  functionName: string;
}

export interface CulpritCommitInput {
  hash: string;
  author: string;
  message: string;
}

export interface GenerateFixInput {
  errorMessage: string;
  stackFrames: StackFrameInput[];
  culpritCommit: CulpritCommitInput;
  culpritDiff: string;
  projectRepoUrl: string;
}

export interface GeneratedFixFile {
  path: string;
  newContent: string;
  existingSha?: string;
  originalContent?: string;
}

export interface GeneratedFixResult {
  explanation: string;
  files: GeneratedFixFile[];
  prTitle: string;
  prDescription: string;
}

export async function generateFix(
  input: GenerateFixInput
): Promise<GeneratedFixResult | null> {
  const { errorMessage, stackFrames, culpritCommit, culpritDiff, projectRepoUrl } = input;

  const parsedRepo = parseOwnerRepo(projectRepoUrl);
  const owner = parsedRepo?.owner;
  const repo = parsedRepo?.repo;

  // Identify candidate target files from stack trace & culprit diff
  const filePathsSet = new Set<string>();

  for (const sf of stackFrames) {
    if (sf.filePath && !sf.filePath.includes("node_modules") && !sf.filePath.startsWith("<")) {
      filePathsSet.add(sf.filePath.replace(/^[\.\/\\]+/, ""));
    }
  }

  // Also parse filenames from diff patch if present
  const diffFileMatches = culpritDiff.matchAll(/--- a\/(.+?)\n\+\+\+ b\/(.+?)\n/g);
  for (const match of diffFileMatches) {
    if (match[2]) filePathsSet.add(match[2]);
  }

  const targetFilePaths = Array.from(filePathsSet).slice(0, 3); // Limit to top 3 target files

  // Fetch current file contents from GitHub if available
  const filesContext: Array<{ path: string; content: string; sha: string }> = [];

  if (owner && repo && targetFilePaths.length > 0) {
    for (const filePath of targetFilePaths) {
      const current = await getFileContent(owner, repo, filePath);
      if (current && current.content) {
        filesContext.push({
          path: filePath,
          content: current.content,
          sha: current.sha,
        });
      }
    }
  }

  const formattedStack = stackFrames.length > 0
    ? stackFrames.map((sf) => `  at ${sf.functionName} (${sf.filePath}:${sf.lineNumber})`).join("\n")
    : "  (No stack trace available)";

  const formattedFileContents = filesContext.length > 0
    ? filesContext
        .map(
          (f) => `
================================================
FILE PATH: ${f.path}
CURRENT CONTENT:
${f.content}
================================================
`
        )
        .join("\n")
    : "  (No live file content fetched from GitHub API)";

  const prompt = `You are a principal software engineer generating an automated production hotfix patch for an incident.

INCIDENT REPORT:
- Error Message: ${errorMessage}
- Stack Trace:
${formattedStack}

CULPRIT COMMIT DIAGNOSED:
- Commit Hash: ${culpritCommit.hash}
- Author: ${culpritCommit.author}
- Commit Message: ${culpritCommit.message}
- Culprit Diff:
${culpritDiff || "(No diff available)"}

CURRENT TARGET FILE(S) CONTENT:
${formattedFileContents}

INSTRUCTIONS:
1. Carefully diagnose the bug caused by the culprit commit in relation to the stack trace and error message.
2. Produce the CORRECTED, FULL file content for the file(s) that need to be patched.
3. CRITICAL: You must provide the COMPLETE and FULL file content for each modified file in "newContent" (NOT partial diffs, NOT snippets, NOT placeholders).
4. Keep the patch scoped and surgical: only fix the bug directly implicated by the error/culprit. Do not refactor unrelated code.
5. Provide a short pull request title and a detailed markdown PR description explaining the bug, root cause, and fix.

RESPONSE FORMAT INSTRUCTIONS:
Respond ONLY with a valid JSON object matching this exact schema. Do NOT include markdown code fences (\`\`\`json), preamble, or commentary.

JSON Schema:
{
  "explanation": "Brief 1-2 sentence explanation of the patch strategy.",
  "files": [
    {
      "path": "path/to/file.ext",
      "newContent": "complete full updated file content..."
    }
  ],
  "prTitle": "fix(autofix): short descriptive PR title",
  "prDescription": "## Bug Description\\n...\\n\\n## Root Cause\\n...\\n\\n## Fix Overview\\n..."
}
`;

  try {
    const rawOutput = await generateText(prompt);

    let cleanedJson = rawOutput.trim();
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    const parsed = JSON.parse(cleanedJson);

    if (!parsed || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      console.warn("[Generate Fix] Gemini returned invalid JSON schema: 'files' array missing or empty.");
      return null;
    }

    const validFiles: GeneratedFixFile[] = [];

    for (const f of parsed.files) {
      if (typeof f.path === "string" && typeof f.newContent === "string" && f.newContent.trim()) {
        const matchingCtx = filesContext.find((c) => c.path === f.path);
        validFiles.push({
          path: f.path.trim(),
          newContent: f.newContent,
          existingSha: matchingCtx?.sha,
          originalContent: matchingCtx?.content,
        });
      }
    }

    if (validFiles.length === 0) {
      console.warn("[Generate Fix] No valid file replacements parsed from Gemini response.");
      return null;
    }

    return {
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "Automated patch generated.",
      files: validFiles,
      prTitle: typeof parsed.prTitle === "string" ? parsed.prTitle : `fix: automated hotfix for ${validFiles[0].path}`,
      prDescription: typeof parsed.prDescription === "string" ? parsed.prDescription : "Automated hotfix pull request.",
    };
  } catch (error: any) {
    console.error("[Generate Fix] Failed to generate fix via Gemini API:", error?.message || error);
    return null;
  }
}
