// Pure timeline maths (no React), so it can be unit-tested.

export const MAX_WEEK = 20
export const PLAYBACK_SECONDS = 10 // week 0 -> 20 in 10 s (ADR 0011)
const WEEKS_PER_SECOND = MAX_WEEK / PLAYBACK_SECONDS

export const clampWeek = (w: number) => Math.min(MAX_WEEK, Math.max(0, w))

// Playback: move forward by elapsed time. Weeks are fractional while playing.
export function advanceWeek(week: number, dtSeconds: number): number {
  return clampWeek(week + dtSeconds * WEEKS_PER_SECOND)
}

// Keyboard / buttons: jump to the next or previous whole week.
export function stepWeek(week: number, direction: 1 | -1): number {
  const target = direction > 0 ? Math.floor(week + 1e-6) + 1 : Math.ceil(week - 1e-6) - 1
  return clampWeek(target)
}

// Label: "第 8 週" shows the whole week reached so far.
export const displayWeek = (week: number) => Math.floor(week + 1e-6)
