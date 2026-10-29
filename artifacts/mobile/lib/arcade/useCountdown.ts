import { useEffect, useRef, useState } from 'react';

/** Ticks once per second while running; calls onExpire once at zero. */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [left, setLeft] = useState(seconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;
  useEffect(() => {
    if (!running) return;
    setLeft(seconds);
    const startedAt = Date.now();
    let fired = false;
    const id = setInterval(() => {
      const remaining = Math.max(0, seconds - Math.floor((Date.now() - startedAt) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !fired) {
        fired = true;
        clearInterval(id);
        expireRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, seconds]);
  return left;
}
