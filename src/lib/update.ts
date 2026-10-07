const REPO = "Kazeshima/BA-BP";
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const LAST_CHECK_KEY = "ba-draft:update-check";
const DAY = 24 * 60 * 60 * 1000;

/** Compares dotted versions numerically; pre-release suffixes sort before the release. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = "", pre] = v.replace(/^v/, "").split("-", 2);
    return { nums: core.split(".").map((n) => Number.parseInt(n, 10) || 0), pre };
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.nums.length, pb.nums.length); i++) {
    const d = (pa.nums[i] ?? 0) - (pb.nums[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  if (pa.pre && !pb.pre) return -1;
  if (!pa.pre && pb.pre) return 1;
  return (pa.pre ?? "").localeCompare(pb.pre ?? "");
}

/** Returns the newer version string if GitHub has a newer stable release. Checks at most daily. */
export async function checkForUpdate(current: string): Promise<string | null> {
  try {
    const last = Number(localStorage.getItem(LAST_CHECK_KEY) ?? 0);
    if (Date.now() - last < DAY) return null;
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    const { tag_name } = (await res.json()) as { tag_name?: string };
    return tag_name && compareVersions(tag_name, current) > 0 ? tag_name.replace(/^v/, "") : null;
  } catch {
    return null;
  }
}
