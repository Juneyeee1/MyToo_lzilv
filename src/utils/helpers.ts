/**
 * 通用工具函数
 */

export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

export function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export const sumHours = (tasks: Array<{ hours: number }>): number =>
  tasks.reduce((acc, t) => acc + (Number(t.hours) || 0), 0);

export const fmtHours = (n: number): number => {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return v;
};





