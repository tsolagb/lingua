/** Caller owns the timer so manual stop/cancel cannot leave a delayed second stop. */
export function recordingDeadline(onExpire: () => void, milliseconds = 25_000) {
  const timeout = setTimeout(onExpire, milliseconds);
  return () => clearTimeout(timeout);
}
