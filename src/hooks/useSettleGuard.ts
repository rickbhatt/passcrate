import { useCallback, useRef } from "react";

export function useSettleGuard(settleMs: number) {
  const active = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    active.current = true;
  }, []);

  const end = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      active.current = false;
      timer.current = null;
    }, settleMs);
  }, [settleMs]);

  const isActive = useCallback(() => active.current, []);

  return { start, end, isActive };
}
