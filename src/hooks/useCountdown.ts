import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Contagem regressiva (segundos) baseada em timestamp de fim, para o timer de
 * pausa entre séries. `onComplete` dispara uma vez ao chegar a zero.
 */
export function useCountdown(onComplete?: () => void) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);

  const endRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const tick = useCallback(() => {
    const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) {
      clear();
      setRunning(false);
      onCompleteRef.current?.();
    }
  }, []);

  /** Inicia/reinicia a contagem a partir de `seconds`. */
  const start = useCallback(
    (seconds: number) => {
      clear();
      setTotal(seconds);
      setRemaining(seconds);
      endRef.current = Date.now() + seconds * 1000;
      setRunning(true);
      intervalRef.current = setInterval(tick, 250);
    },
    [tick],
  );

  /** Soma/subtrai segundos ao tempo restante (ex.: +15s / −15s). */
  const adjust = useCallback(
    (delta: number) => {
      endRef.current += delta * 1000;
      setTotal((t) => Math.max(1, t + delta));
      tick();
    },
    [tick],
  );

  const stop = useCallback(() => {
    clear();
    setRunning(false);
    setRemaining(0);
  }, []);

  useEffect(() => clear, []);

  const progress = total > 0 ? 1 - remaining / total : 0;

  return { remaining, total, running, progress, start, adjust, stop };
}
