/**
 * 日期工具函数
 */

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const formatDate = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const formatMMDD = (d: Date): string =>
  `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;

export const addDays = (d: Date, days: number): Date => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

export const lastNDays = (n: number): Date[] => {
  const end = new Date();
  const start = addDays(end, -(n - 1));
  const days: Date[] = [];
  for (let i = 0; i < n; i++) {
    days.push(addDays(start, i));
  }
  return days;
};

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一作为一周的开始
  const start = new Date(d.getFullYear(), d.getMonth(), diff);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};





