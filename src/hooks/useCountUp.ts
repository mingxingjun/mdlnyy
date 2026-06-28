import { useEffect, useRef, useState } from 'react';

/**
 * 数字递增动画 hook（rAF + easeOutCubic）
 *
 * @param target 目标数值
 * @param duration 动画时长（ms），默认 1000
 * @returns 当前递增到的数值，从 0 开始
 *
 * 用法：const animated = useCountUp(Statistics.totalAnswered);
 *      <p>{animated}</p>
 */
export function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return value;
}
