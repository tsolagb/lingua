export type QuestionClockToken = Readonly<{ id: string; generation: number }>;

/** Identity-bound clocks reject queued ticks from an earlier question or replay. */
export function createQuestionClock(durationSeconds: number, now: () => number = Date.now) {
  let generation = 0;
  let active: { token: QuestionClockToken; deadline: number | null } | null = null;
  return {
    open(id: string, paused = false): QuestionClockToken {
      const token = Object.freeze({ id, generation: ++generation });
      active = { token, deadline: paused ? null : now() + durationSeconds * 1000 };
      return token;
    },
    token() { return active?.token ?? null; },
    arm(token: QuestionClockToken | null) {
      if (!token || active?.token !== token || active.deadline !== null) return false;
      active.deadline = now() + durationSeconds * 1000;
      return true;
    },
    remaining(token: QuestionClockToken | null): number | null {
      if (!token || active?.token !== token || active.deadline === null) return null;
      return Math.max(0, (active.deadline - now()) / 1000);
    },
    close(token?: QuestionClockToken | null) {
      if (token === undefined || active?.token === token) active = null;
    },
  };
}
