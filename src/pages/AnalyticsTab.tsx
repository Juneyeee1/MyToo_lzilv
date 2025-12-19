import React, { useMemo, useState } from "react";
import { TrendingUp, PieChart as PieChartIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WeeklyTaskTracker } from "@/components/WeeklyTaskTracker";
import {
  formatDate,
  formatMMDD,
  lastNDays,
  getWeekRange,
  getMonthRange,
  getDateRange,
  parseDate,
  addDays,
} from "@/utils/date";
import { sumHours } from "@/utils/helpers";
import { MOODS } from "@/constants/moods";
import type { TrackerData, WeeklyTask, Habit } from "@/types";

interface AnalyticsTabProps {
  data: TrackerData;
  setData: React.Dispatch<React.SetStateAction<TrackerData>>;
}

type PeriodType = "day" | "week" | "month" | "custom";

export function AnalyticsTab({ data, setData }: AnalyticsTabProps) {
  const [selectedTypes, setSelectedTypes] = useState({
    total: true,
    external: true,
    study: true,
    health: true,
  });

  // 饼图相关状态
  const [piePeriod, setPiePeriod] = useState<PeriodType>("day");
  const [customStartDate, setCustomStartDate] = useState(formatDate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(formatDate(new Date()));
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const series30 = useMemo(() => {
    const days = lastNDays(30);
    return days.map((d) => {
      const k = formatDate(d);
      const tasks = data.tasksByDate?.[k] ?? [];
      const total = sumHours(tasks);
      
      // 分别计算各类别时间
      const external = sumHours(tasks.filter((t) => t.primary === "external"));
      const study = sumHours(tasks.filter((t) => t.primary === "study"));
      const health = sumHours(tasks.filter((t) => t.primary === "health"));
      
      return {
        date: k.slice(5), // MM-DD
        dateKey: k,
        total: Math.round(total * 10) / 10,
        external: Math.round(external * 10) / 10,
        study: Math.round(study * 10) / 10,
        health: Math.round(health * 10) / 10,
      };
    });
  }, [data.tasksByDate]);

  const moodStats = useMemo(() => {
    const counter = Object.fromEntries(MOODS.map((m) => [m.key, 0]));
    for (const k of Object.keys(data.moodByDate || {})) {
      const m = data.moodByDate[k]?.mood;
      if (m && counter[m] !== undefined) counter[m] += 1;
    }
    return MOODS.map((m) => ({
      mood: m.label,
      key: m.key,
      count: counter[m.key],
    }));
  }, [data.moodByDate]);

  // 心态日志相关状态
  const [moodLogExpanded, setMoodLogExpanded] = useState(false);
  const [moodLogPeriod, setMoodLogPeriod] = useState<PeriodType>("month");
  const [moodLogCustomStartDate, setMoodLogCustomStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatDate(d);
  });
  const [moodLogCustomEndDate, setMoodLogCustomEndDate] = useState(formatDate(new Date()));
  const [showMoodLogCustomDatePicker, setShowMoodLogCustomDatePicker] = useState(false);

  // 计算心态日志数据
  const moodLogData = useMemo(() => {
    let dateRange: Date[] = [];
    const today = new Date();

    switch (moodLogPeriod) {
      case "month":
        const monthRange = getMonthRange(today);
        dateRange = getDateRange(monthRange.start, monthRange.end);
        break;
      case "custom":
        if (moodLogCustomStartDate && moodLogCustomEndDate) {
          const start = parseDate(moodLogCustomStartDate);
          const end = parseDate(moodLogCustomEndDate);
          dateRange = getDateRange(start, end);
        }
        break;
    }

    // 收集有备注的心情记录
    const records: Array<{ date: string; dateKey: string; mood: string; note: string }> = [];
    dateRange.forEach((date) => {
      const dateKey = formatDate(date);
      const record = data.moodByDate?.[dateKey];
      if (record && record.note && record.note.trim()) {
        records.push({
          date: formatMMDD(date),
          dateKey,
          mood: record.mood,
          note: record.note,
        });
      }
    });

    // 按月份分组
    const groupedByMonth = new Map<string, typeof records>();
    records.forEach((record) => {
      const date = parseDate(record.dateKey);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!groupedByMonth.has(monthKey)) {
        groupedByMonth.set(monthKey, []);
      }
      groupedByMonth.get(monthKey)!.push(record);
    });

    // 转换为数组并按月份排序（最新的在前）
    return Array.from(groupedByMonth.entries())
      .map(([monthKey, records]) => ({
        monthKey,
        monthLabel: `${monthKey.split("-")[0]}年${parseInt(monthKey.split("-")[1])}月`,
        records: records.sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [data.moodByDate, moodLogPeriod, moodLogCustomStartDate, moodLogCustomEndDate]);

  const handleWeeklyTasksChange = (tasks: WeeklyTask[]) => {
    setData((prev) => ({
      ...prev,
      weeklyTasks: tasks,
    }));
  };

  const handleTypeToggle = (type: keyof typeof selectedTypes) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // 计算饼图数据
  const pieData = useMemo(() => {
    let dateRange: Date[] = [];
    const today = new Date();

    switch (piePeriod) {
      case "day":
        dateRange = [today];
        break;
      case "week":
        const weekRange = getWeekRange(today);
        dateRange = getDateRange(weekRange.start, weekRange.end);
        break;
      case "month":
        const monthRange = getMonthRange(today);
        dateRange = getDateRange(monthRange.start, monthRange.end);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const start = parseDate(customStartDate);
          const end = parseDate(customEndDate);
          dateRange = getDateRange(start, end);
        }
        break;
    }

    // 收集所有日期范围内的任务
    const allTasks: Array<{ hours: number; primary: string }> = [];
    dateRange.forEach((date) => {
      const dateKey = formatDate(date);
      const tasks = data.tasksByDate?.[dateKey] ?? [];
      allTasks.push(...tasks);
    });

    // 计算三种类型的时间
    const external = sumHours(
      allTasks.filter((t) => t.primary === "external")
    );
    const study = sumHours(allTasks.filter((t) => t.primary === "study"));
    const health = sumHours(allTasks.filter((t) => t.primary === "health"));

    const total = external + study + health;

    // 构建饼图数据
    const pieChartData = [
      {
        name: "外部任务",
        value: Math.round(external * 10) / 10,
        percentage: total > 0 ? Math.round((external / total) * 100) : 0,
        color: "#3b82f6",
      },
      {
        name: "个人成长",
        value: Math.round(study * 10) / 10,
        percentage: total > 0 ? Math.round((study / total) * 100) : 0,
        color: "#10b981",
      },
      {
        name: "运动&健康",
        value: Math.round(health * 10) / 10,
        percentage: total > 0 ? Math.round((health / total) * 100) : 0,
        color: "#f59e0b",
      },
    ].filter((item) => item.value > 0); // 只显示有数据的项

    return { data: pieChartData, total: Math.round(total * 10) / 10 };
  }, [data.tasksByDate, piePeriod, customStartDate, customEndDate]);

  // 计算习惯的连续坚持天数
  const calculateStreakDays = (habit: Habit): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = parseDate(habit.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = habit.endDate ? parseDate(habit.endDate) : today;
    endDate.setHours(23, 59, 59, 999);
    
    // 如果习惯还没开始或已经结束，返回0
    if (today < startDate) return 0;
    if (endDate < today) {
      // 如果习惯已结束，从结束日期往前计算
      let streakDays = 0;
      let currentDate = new Date(endDate);
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate >= startDate) {
        const dateKey = formatDate(currentDate);
        const record = data.habitChecks?.[dateKey];
        
        if (record?.status === "green") {
          streakDays++;
          currentDate = addDays(currentDate, -1);
        } else {
          break;
        }
      }
      return streakDays;
    }
    
    // 习惯进行中，从今天往前计算连续完成天数
    let streakDays = 0;
    let currentDate = new Date(today);
    
    while (currentDate >= startDate) {
      const dateKey = formatDate(currentDate);
      const record = data.habitChecks?.[dateKey];
      
      // 如果状态是green，继续计数
      if (record?.status === "green") {
        streakDays++;
        currentDate = addDays(currentDate, -1);
      } else {
        // 如果遇到非green状态（包括none和red），停止计数
        break;
      }
    }
    
    return streakDays;
  };

  return (
    <div className="space-y-6">
      {/* 习惯养成记录 */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">习惯养成记录</CardTitle>
        </CardHeader>
        <CardContent>
          {data.habits && data.habits.length > 0 ? (
            <div className="space-y-4">
              {data.habits.map((habit) => {
                const streakDays = calculateStreakDays(habit);
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-foreground mb-1">
                        {habit.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {habit.startDate} 至 {habit.endDate || "持续中"}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {streakDays}
                      </div>
                      <div className="text-xs text-muted-foreground">坚持天数</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[100px] items-center justify-center text-muted-foreground">
              暂无习惯记录，请在记录tab下创建习惯
            </div>
          )}
        </CardContent>
      </Card>

      {/* 每周任务跟踪 */}
      <WeeklyTaskTracker
        tasks={data.weeklyTasks || []}
        onTasksChange={handleWeeklyTasksChange}
      />

      {/* 任务时间占比饼图 */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle className="text-base">任务时间占比</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* 周期选择器 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant={piePeriod === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPiePeriod("day");
                setShowCustomDatePicker(false);
              }}
              className="rounded-xl"
            >
              当天
            </Button>
            <Button
              variant={piePeriod === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPiePeriod("week");
                setShowCustomDatePicker(false);
              }}
              className="rounded-xl"
            >
              本周
            </Button>
            <Button
              variant={piePeriod === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPiePeriod("month");
                setShowCustomDatePicker(false);
              }}
              className="rounded-xl"
            >
              本月
            </Button>
            <Button
              variant={piePeriod === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPiePeriod("custom");
                setShowCustomDatePicker(true);
              }}
              className="rounded-xl"
            >
              自定义日期
            </Button>
          </div>

          {/* 自定义日期选择器 */}
          {showCustomDatePicker && piePeriod === "custom" && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">开始日期:</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-xl w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">结束日期:</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-xl w-auto"
                />
              </div>
            </div>
          )}

          {/* 饼图 */}
          {pieData.data.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) =>
                      `${name}: ${percentage}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} 小时`, "时间"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-muted-foreground">
                总时长: {pieData.total} 小时
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              暂无数据
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle className="text-base">每日总时长趋势（近30天）</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* 时间类型选择器 */}
          <div className="mb-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.total}
                onChange={() => handleTypeToggle("total")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label className="text-sm font-normal cursor-pointer">总时间</Label>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.external}
                onChange={() => handleTypeToggle("external")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label className="text-sm font-normal cursor-pointer">外部任务时间</Label>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.study}
                onChange={() => handleTypeToggle("study")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label className="text-sm font-normal cursor-pointer">个人成长时间</Label>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.health}
                onChange={() => handleTypeToggle("health")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label className="text-sm font-normal cursor-pointer">运动&健康时间</Label>
            </label>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={series30}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {selectedTypes.total && (
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="总时间"
                />
              )}
              {selectedTypes.external && (
                <Line
                  type="monotone"
                  dataKey="external"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="外部任务时间"
                />
              )}
              {selectedTypes.study && (
                <Line
                  type="monotone"
                  dataKey="study"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="个人成长时间"
                />
              )}
              {selectedTypes.health && (
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="运动&健康时间"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">心情统计</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moodStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mood" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#000" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 心态日志 */}
      <Card className="rounded-2xl">
        <CardHeader>
          <button
            onClick={() => setMoodLogExpanded(!moodLogExpanded)}
            className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
          >
            <CardTitle className="text-base">心态日志</CardTitle>
            {moodLogExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {moodLogExpanded && (
          <CardContent>
            {/* 日期范围选择器 */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                variant={moodLogPeriod === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMoodLogPeriod("month");
                  setShowMoodLogCustomDatePicker(false);
                }}
                className="rounded-xl"
              >
                本月
              </Button>
              <Button
                variant={moodLogPeriod === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMoodLogPeriod("custom");
                  setShowMoodLogCustomDatePicker(true);
                }}
                className="rounded-xl"
              >
                自定义日期
              </Button>
            </div>

            {/* 自定义日期选择器 */}
            {showMoodLogCustomDatePicker && moodLogPeriod === "custom" && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">开始日期:</Label>
                  <Input
                    type="date"
                    value={moodLogCustomStartDate}
                    onChange={(e) => setMoodLogCustomStartDate(e.target.value)}
                    className="rounded-xl w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">结束日期:</Label>
                  <Input
                    type="date"
                    value={moodLogCustomEndDate}
                    onChange={(e) => setMoodLogCustomEndDate(e.target.value)}
                    className="rounded-xl w-auto"
                  />
                </div>
              </div>
            )}

            {/* 心态日志内容 */}
            {moodLogData.length > 0 ? (
              <div className="space-y-6">
                {moodLogData.map(({ monthKey, monthLabel, records }) => (
                  <div key={monthKey} className="space-y-3">
                    <div className="text-base font-semibold text-foreground border-b border-gray-200 pb-2">
                      {monthLabel}
                    </div>
                    <div className="space-y-3">
                      {records.map((record) => {
                        const moodOption = MOODS.find((m) => m.key === record.mood);
                        const MoodIcon = moodOption?.icon;
                        return (
                          <div
                            key={record.dateKey}
                            className="p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {MoodIcon && (
                                  <MoodIcon className="h-5 w-5 text-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-foreground">
                                    {record.date}
                                  </span>
                                  {moodOption && (
                                    <span className="text-sm text-muted-foreground">
                                      {moodOption.label}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                                  {record.note}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                暂无心情备注记录
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}





