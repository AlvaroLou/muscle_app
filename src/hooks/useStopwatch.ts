import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cronômetro (contagem crescente) baseado em timestamps reais — não acumula
 * `+1s` a cada tick, então não sofre drift nem congela se o app suspender.
 * Usado para a duração total do treino.
 */
export function useStopwatch(autoStart = false, initialElapsedMs = 0) {
  const [elapsedMs, setElapsedMs] = useState(initialElapsedMs);
  const [running, setRunning] = useState(autoStart);

  const startRef = useRef(Date.now() - initialElapsedMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsedMs;

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsedRef.current;
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startRef.current);
      }, 250);
    } else {
      clear();
    }
    return clear;
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);

  return { elapsedMs, running, start, pause };
}
