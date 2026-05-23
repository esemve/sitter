import { packageVersion } from './version.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@agentstuff%2Fsitter/latest';
const TIMEOUT_MS = 3000;

interface NpmLatestResponse {
  version?: string;
}

/**
 * Fetch the latest published version from npm registry with a timeout.
 * Returns the version string, or null on timeout/failure.
 */
async function fetchLatestVersion(): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(NPM_REGISTRY_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NpmLatestResponse;
    return data.version ?? null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Check if a newer version is available on npm.
 * Returns the newer version string, or null if no update or check failed.
 */
export async function checkForUpdate(): Promise<string | null> {
  const latest = await fetchLatestVersion();
  if (!latest) return null;

  // Simple semver comparison: split by dot and compare numerically.
  // Assumes valid semver strings (no pre-release tags needed for basic check).
  const currentParts = packageVersion.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const cur = currentParts[i] ?? 0;
    const lat = latestParts[i] ?? 0;
    if (lat > cur) return latest;
    if (lat < cur) return null;
  }

  return null; // equal
}
