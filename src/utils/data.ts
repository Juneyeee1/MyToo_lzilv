/**
 * 数据初始化工具
 */

import { formatDate, addDays } from "./date";
import { uid } from "./helpers";
import type { TrackerData } from "@/types";

export function buildDefaultData(): TrackerData {
  const today = new Date();
  const t = formatDate(today);
  const yesterday = formatDate(addDays(today, -1));
  const twoDaysAgo = formatDate(addDays(today, -2));

  return {
    habitChecks: {
      [twoDaysAgo]: { status: "green", note: "" },
      [yesterday]: { status: "red", note: "" },
      [t]: { status: "green", note: "" },
    },
    weeklyTasks: [],
    tasksByDate: {
      [twoDaysAgo]: [
        {
          id: uid(),
          title: "跑步 5km",
          hours: 1,
          primary: "health",
          secondary: "spontaneous",
          details: "节奏跑 + 拉伸",
        },
        {
          id: uid(),
          title: "整理简历",
          hours: 1.5,
          primary: "study",
          secondary: "obligation",
          details: "补充项目描述 + 作品链接",
        },
      ],
      [yesterday]: [
        {
          id: uid(),
          title: "陪家人吃饭",
          hours: 2,
          primary: "external",
          secondary: "family",
          details: "聊天放松",
        },
      ],
      [t]: [
        {
          id: uid(),
          title: "阅读：前端性能优化",
          hours: 1.2,
          primary: "study",
          secondary: "spontaneous",
          details: "记录 5 条实践要点",
        },
        {
          id: uid(),
          title: "拉伸 + 早睡",
          hours: 0.6,
          primary: "health",
          secondary: "spontaneous",
          details: "肩颈 + 髋部",
        },
      ],
    },
    moodByDate: {
      [twoDaysAgo]: { mood: "good", note: "完成了很多小目标" },
      [yesterday]: { mood: "ok", note: "有点累，但还行" },
      [t]: { mood: "great", note: "专注度很高" },
    },
    todos: [
      {
        id: uid(),
        title: "完成项目重构",
        completed: false,
        createdAt: formatDate(addDays(today, -5)),
      },
      {
        id: uid(),
        title: "学习新的技术栈",
        completed: false,
        createdAt: formatDate(addDays(today, -3)),
      },
      {
        id: uid(),
        title: "整理工作笔记",
        completed: true,
        createdAt: formatDate(addDays(today, -7)),
      },
    ],
  };
}

import { PRIMARY_CATEGORIES } from "@/constants/categories";
import type { Task } from "@/types";

export function groupTasksByPrimary(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  for (const p of PRIMARY_CATEGORIES) map.set(p.key, []);
  for (const t of tasks) {
    if (!map.has(t.primary)) map.set(t.primary, []);
    map.get(t.primary)!.push(t);
  }
  return map;
}

