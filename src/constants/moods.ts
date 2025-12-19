/**
 * 心情选项常量
 */

import { Sparkles, Smile, Meh, Frown } from "lucide-react";
import type { MoodOption } from "@/types";

export const MOODS: MoodOption[] = [
  {
    key: "great",
    label: "很好",
    icon: Sparkles,
    hint: "能量充足",
  },
  { key: "good", label: "不错", icon: Smile, hint: "状态在线" },
  { key: "ok", label: "一般", icon: Meh, hint: "还可以" },
  { key: "bad", label: "糟糕", icon: Frown, hint: "需要休息" },
];





