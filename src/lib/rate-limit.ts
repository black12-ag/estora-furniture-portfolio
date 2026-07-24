// Small localStorage-backed cooldown helper for abuse-sensitive actions
// (password reset requests, verification email resends, reset submissions).
// This is a client-side speed bump, not real backend rate limiting.

type Bucket = { count: number; firstAt: number; lockUntil: number };

export type RateLimitConfig = {
  key: string;
  // Max attempts allowed within `windowMs`.
  max: number;
  windowMs: number;
  // How long to lock out once the max is exceeded.
  lockMs: number;
};

function read(key: string): Bucket | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Bucket;
  } catch {
    return null;
  }
}

function write(key: string, b: Bucket | null) {
  if (typeof window === "undefined") return;
  try {
    if (!b) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(b));
  } catch { /* ignore */ }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number; reason: string };

export function checkRateLimit(cfg: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const b = read(cfg.key);
  if (b?.lockUntil && b.lockUntil > now) {
    return { ok: false, retryAfterMs: b.lockUntil - now, reason: "locked" };
  }
  if (!b || now - b.firstAt > cfg.windowMs) {
    return { ok: true, remaining: cfg.max - 1 };
  }
  if (b.count >= cfg.max) {
    return { ok: false, retryAfterMs: cfg.windowMs - (now - b.firstAt), reason: "window_exceeded" };
  }
  return { ok: true, remaining: cfg.max - b.count - 1 };
}

export function recordAttempt(cfg: RateLimitConfig) {
  const now = Date.now();
  const b = read(cfg.key);
  if (!b || now - b.firstAt > cfg.windowMs) {
    write(cfg.key, { count: 1, firstAt: now, lockUntil: 0 });
    return;
  }
  const nextCount = b.count + 1;
  const nextLock = nextCount >= cfg.max ? now + cfg.lockMs : 0;
  write(cfg.key, { count: nextCount, firstAt: b.firstAt, lockUntil: nextLock });
}

export function clearAttempts(key: string) {
  write(key, null);
}

export function formatWait(ms: number): string {
  const s = Math.max(1, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  return `${m} min`;
}
