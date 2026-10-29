export const MOTION = {
  pressInMs: 90,
  transitionMs: 180,
  screenMs: 280,
  celebrationMs: 900,
  answerPauseMs: 450,
  wrongPauseMs: 500,
  speechRequestTimeoutMs: 20_000,
  speechPlaybackTimeoutMs: 60_000,
} as const;

export const MOTION_SPRING = {
  damping: 18,
  stiffness: 320,
} as const;
