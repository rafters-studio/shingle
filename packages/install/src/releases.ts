interface Asset {
  name: string;
  browser_download_url: string;
}

interface ReleasePayload {
  tag_name: string;
  published_at: string;
  html_url: string;
  assets: Asset[];
}

export type PlatformKey =
  | "macos-arm64"
  | "macos-x64"
  | "linux-x64"
  | "linux-arm64"
  | "windows-x64";

export interface PlatformDownload {
  platform: PlatformKey;
  label: string;
  filename: string;
  url: string;
}

export interface ReleaseInfo {
  tag: string;
  date: string;
  platforms: PlatformDownload[];
  releaseUrl: string;
  allReleasesUrl: string;
}

const PLATFORM_PATTERNS: Array<[RegExp, PlatformKey, string]> = [
  [/macos[-_]arm64|darwin[-_]arm64/i, "macos-arm64", "macOS arm64 (Apple)"],
  [/macos[-_](x86[-_]?|x)64|darwin[-_](x86[-_]?|x)64/i, "macos-x64", "macOS x64 (Intel)"],
  [/linux[-_](x86[-_]?|x)64/i, "linux-x64", "Linux x86_64"],
  [/linux[-_](arm64|aarch64)/i, "linux-arm64", "Linux aarch64"],
  [/windows[-_](x86[-_]?|x)64|win[-_](x86[-_]?|x)64/i, "windows-x64", "Windows x64"],
];

export const PLATFORM_DOWNLOAD_LABEL: Record<PlatformKey, string> = {
  "macos-arm64": "Download for macOS (Apple Silicon)",
  "macos-x64": "Download for macOS (Intel)",
  "linux-x64": "Download for Linux (x86_64)",
  "linux-arm64": "Download for Linux (aarch64)",
  "windows-x64": "Download for Windows",
};

export const DEFAULT_PLATFORM: PlatformKey = "macos-arm64";

const cache = new Map<string, Promise<ReleaseInfo | null>>();

async function fetchRelease(repo: string): Promise<ReleaseInfo | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json()) as ReleasePayload;
  const seen = new Set<PlatformKey>();
  const platforms: PlatformDownload[] = [];

  for (const asset of data.assets ?? []) {
    for (const [pattern, platform, label] of PLATFORM_PATTERNS) {
      if (pattern.test(asset.name) && !seen.has(platform)) {
        seen.add(platform);
        platforms.push({
          platform,
          label,
          filename: asset.name,
          url: asset.browser_download_url,
        });
        break;
      }
    }
  }

  return {
    tag: data.tag_name ?? "",
    date: data.published_at ? data.published_at.split("T")[0] : "",
    platforms,
    releaseUrl: data.html_url ?? `https://github.com/${repo}/releases`,
    allReleasesUrl: `https://github.com/${repo}/releases`,
  };
}

export function getLatestRelease(repo: string): Promise<ReleaseInfo | null> {
  const existing = cache.get(repo);
  if (existing) return existing;
  const promise = fetchRelease(repo);
  cache.set(repo, promise);
  return promise;
}
