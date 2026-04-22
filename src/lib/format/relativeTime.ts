export function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (!Number.isFinite(diff)) return null;
  if (diff < 15_000) return "just now";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

