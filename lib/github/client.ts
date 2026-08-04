import { Octokit } from "@octokit/rest";

export interface GitHubCommitData {
  hash: string;
  author: string;
  message: string;
  timestamp: string;
  filesChanged: string[];
}

export interface CommitDiffData {
  hash: string;
  diff: string;
  filesChanged: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }>;
}

/**
 * Parses project repoUrl (e.g., "owner/repo", "https://github.com/owner/repo", "git@github.com:owner/repo.git")
 * into { owner, repo } or null if invalid.
 */
export function parseOwnerRepo(repoUrl: string): { owner: string; repo: string } | null {
  if (!repoUrl) return null;

  let clean = repoUrl.trim();
  clean = clean.replace(/^https?:\/\/github\.com\//i, "");
  clean = clean.replace(/^git@github\.com:/i, "");
  clean = clean.replace(/\.git$/i, "");
  clean = clean.replace(/^\/+|\/+$/g, "");

  const parts = clean.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

/**
 * Creates and returns an Octokit client instance if GITHUB_TOKEN is available.
 */
function getOctokit(): Octokit | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === "your-github-personal-access-token-here") {
    console.warn("[GitHub Client] GITHUB_TOKEN is missing or using placeholder in environment.");
    return null;
  }
  return new Octokit({ auth: token });
}

/**
 * Fetches recent commits from the default branch of a GitHub repository,
 * including the list of changed files per commit.
 */
export async function getRecentCommits(
  owner: string,
  repo: string,
  limit = 20
): Promise<GitHubCommitData[]> {
  const octokit = getOctokit();
  if (!octokit) {
    console.warn("[GitHub Client] getRecentCommits skipped: GITHUB_TOKEN not configured.");
    return [];
  }

  try {
    const listRes = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: limit,
    });

    const commitList = listRes.data || [];

    // Fetch commit details in parallel to get changed files per commit
    const detailedCommits = await Promise.all(
      commitList.map(async (item) => {
        try {
          const detailRes = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: item.sha,
          });
          const files = detailRes.data.files || [];
          const filesChanged = files.map((f) => f.filename);

          return {
            hash: item.sha,
            author: item.commit.author?.name || item.author?.login || "Unknown",
            message: item.commit.message || "",
            timestamp: item.commit.author?.date || new Date().toISOString(),
            filesChanged,
          };
        } catch (detailErr: any) {
          console.warn(
            `[GitHub Client] Failed to fetch changed files for commit ${item.sha.slice(0, 7)}:`,
            detailErr?.message || detailErr
          );
          return {
            hash: item.sha,
            author: item.commit.author?.name || item.author?.login || "Unknown",
            message: item.commit.message || "",
            timestamp: item.commit.author?.date || new Date().toISOString(),
            filesChanged: [],
          };
        }
      })
    );

    return detailedCommits;
  } catch (error: any) {
    console.error(
      `[GitHub Client] Failed to list recent commits for ${owner}/${repo}:`,
      error?.message || error
    );
    return [];
  }
}

/**
 * Fetches diff/patch content for a specific commit.
 */
export async function getCommitDiff(
  owner: string,
  repo: string,
  sha: string
): Promise<CommitDiffData | null> {
  const octokit = getOctokit();
  if (!octokit) {
    console.warn("[GitHub Client] getCommitDiff skipped: GITHUB_TOKEN not configured.");
    return null;
  }

  try {
    const detailRes = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    const data = detailRes.data;
    const files = data.files || [];

    const diffContent = files
      .map((f) => {
        const patchHeader = `--- a/${f.filename}\n+++ b/${f.filename}\n`;
        return patchHeader + (f.patch || "(Binary file or no patch available)");
      })
      .join("\n\n");

    return {
      hash: sha,
      diff: diffContent,
      filesChanged: files.map((f) => ({
        filename: f.filename,
        status: f.status || "modified",
        additions: f.additions || 0,
        deletions: f.deletions || 0,
        patch: f.patch,
      })),
    };
  } catch (error: any) {
    console.error(
      `[GitHub Client] Failed to fetch commit diff for ${owner}/${repo} @ ${sha.slice(0, 7)}:`,
      error?.message || error
    );
    return null;
  }
}

/**
 * Fetches current UTF-8 file content and blob SHA for a specific path in the repository.
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string } | null> {
  const octokit = getOctokit();
  if (!octokit) {
    console.warn("[GitHub Client] getFileContent skipped: GITHUB_TOKEN not configured.");
    return null;
  }

  try {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ...(ref ? { ref } : {}),
    });

    if (Array.isArray(res.data) || !("content" in res.data)) {
      console.warn(`[GitHub Client] Target path "${path}" is a directory or sub-module, not a file.`);
      return null;
    }

    const rawContent = Buffer.from(res.data.content, "base64").toString("utf-8");
    return {
      content: rawContent,
      sha: res.data.sha,
    };
  } catch (error: any) {
    console.warn(`[GitHub Client] Failed to fetch file content for ${owner}/${repo}/${path}:`, error?.message || error);
    return null;
  }
}

/**
 * Fetches the default branch name for a repository (e.g. "main" or "master").
 */
export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const octokit = getOctokit();
  if (!octokit) return "main";

  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    return res.data.default_branch || "main";
  } catch (error: any) {
    console.warn(`[GitHub Client] Failed to fetch default branch for ${owner}/${repo}, defaulting to 'main':`, error?.message || error);
    return "main";
  }
}

/**
 * Creates a new git branch off a base reference (defaults to the default branch).
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromRef?: string
): Promise<{ branchName: string; sha: string } | null> {
  const octokit = getOctokit();
  if (!octokit) {
    console.warn("[GitHub Client] createBranch skipped: GITHUB_TOKEN not configured.");
    return null;
  }

  try {
    const baseBranch = fromRef || (await getDefaultBranch(owner, repo));

    // Get latest commit SHA of baseBranch
    const refRes = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: baseBranch,
    });
    const baseSha = refRes.data.sha;

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    console.log(`[GitHub Client] Created branch "${branchName}" off "${baseBranch}" (${baseSha.slice(0, 7)})`);
    return { branchName, sha: baseSha };
  } catch (error: any) {
    console.error(`[GitHub Client] Failed to create branch "${branchName}" in ${owner}/${repo}:`, error?.message || error);
    throw error;
  }
}

/**
 * Commits file updates to a specific branch in the repository.
 */
export async function commitFileChanges(
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string; newContent: string; sha?: string }>
): Promise<string[]> {
  const octokit = getOctokit();
  if (!octokit) {
    throw new Error("[GitHub Client] GITHUB_TOKEN not configured for committing file changes.");
  }

  const updatedFiles: string[] = [];

  for (const file of files) {
    try {
      let currentSha = file.sha;

      // If SHA was not provided, attempt to fetch existing file SHA
      if (!currentSha) {
        const existing = await getFileContent(owner, repo, file.path, branch);
        if (existing) {
          currentSha = existing.sha;
        }
      }

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.path,
        branch,
        message: `fix(autofix): automated patch for ${file.path}`,
        content: Buffer.from(file.newContent, "utf-8").toString("base64"),
        ...(currentSha ? { sha: currentSha } : {}),
      });

      updatedFiles.push(file.path);
      console.log(`[GitHub Client] Successfully committed updated content for ${file.path} on branch ${branch}`);
    } catch (fileErr: any) {
      console.error(`[GitHub Client] Failed to commit changes to ${file.path} on branch ${branch}:`, fileErr?.message || fileErr);
      throw new Error(`Failed to commit changes for file "${file.path}": ${fileErr?.message || fileErr}`);
    }
  }

  return updatedFiles;
}

/**
 * Opens a pull request on GitHub.
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  branch: string,
  baseBranch: string,
  title: string,
  description: string
): Promise<{ prUrl: string; prNumber: number }> {
  const octokit = getOctokit();
  if (!octokit) {
    throw new Error("[GitHub Client] GITHUB_TOKEN not configured for creating pull request.");
  }

  try {
    const res = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head: branch,
      base: baseBranch,
      body: description,
    });

    console.log(`[GitHub Client] Pull Request #${res.data.number} created successfully: ${res.data.html_url}`);
    return {
      prUrl: res.data.html_url,
      prNumber: res.data.number,
    };
  } catch (error: any) {
    console.error(`[GitHub Client] Failed to create pull request for branch ${branch} -> ${baseBranch}:`, error?.message || error);
    throw error;
  }
}

