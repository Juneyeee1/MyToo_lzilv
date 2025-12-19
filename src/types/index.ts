export interface Task {
  id: string;
  title: string;
  hours: number;
  primary: string;
  secondary: string;
  details: string;
}

export interface MoodRecord {
  mood: string;
  note: string;
}

export interface Habit {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string; // 创建时间，用于区分不同的习惯
}

export interface TrackerData {
  habitChecks: Record<string, HabitRecord>;
  tasksByDate: Record<string, Task[]>;
  moodByDate: Record<string, MoodRecord>;
  habitSettings?: {
    name: string;
    startDate: string;
    endDate: string;
  };
  habits?: Habit[]; // 习惯列表
  todos?: TodoItem[];
  weeklyTasks?: WeeklyTask[];
}

export interface Category {
  key: string;
  label: string;
}

export interface MoodOption {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

export interface ChartDataPoint {
  date: string;
  dateKey: string;
  total: number;
}

export interface MoodStat {
  mood: string;
  key: string;
  count: number;
}

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// 每周任务状态：none(无) -> green(绿色) -> yellow(黄色) -> red(红色)
export type WeekStatus = "none" | "green" | "yellow" | "red";

export interface WeekRecord {
  status: WeekStatus;
  note: string; // 具体完成情况备注
}

// 习惯状态：none(无) -> green(已完成) -> red(未完成)
export type HabitStatus = "none" | "green" | "red";

export interface HabitRecord {
  status: HabitStatus;
  note: string; // 完成情况或未完成原因
}

export interface WeeklyTask {
  id: string;
  title: string;
  weeks: Record<number, WeekRecord>; // 周数（1, 2, 3, ...） -> 记录
  createdAt: string;
}

