import type { Attempt } from './types';

/** Charge the interval using its previous running state, not the state after resuming. */
export class ActivePlayClock {
  private previous: number;
  private running = false;

  constructor(now: number) { this.previous = now; }

  sample(now: number, running: boolean): number {
    const seconds = this.running ? Math.max(0, now - this.previous) / 1000 : 0;
    this.previous = now;
    this.running = running;
    return seconds;
  }
}

export function elapseAttempt(attempt: Attempt | null, seconds: number): Attempt | null {
  if (!attempt || attempt.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return attempt;
  const spent = Math.min(attempt.remaining, seconds);
  const remaining = Math.max(0, attempt.remaining - spent);
  return {
    ...attempt,
    remaining,
    elapsed: attempt.elapsed + spent,
    status: remaining === 0 ? 'timeout' : 'playing',
  };
}