import { useState, useEffect, useMemo } from "react";
import { Plus, Settings, GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeekStrip } from "@/components/WeekStrip";
import { StatPill } from "@/components/StatPill";
import { MoodPicker } from "@/components/MoodPicker";
import { TaskList } from "@/components/TaskList";
import { TodoList } from "@/components/TodoList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { formatDate, addDays } from "@/utils/date";
import { clamp, sumHours, fmtHours, uid } from "@/utils/helpers";
import type { Habit } from "@/types";
import { PRIMARY_CATEGORIES, SECONDARY_CATEGORIES } from "@/constants/categories";
import { MOODS } from "@/constants/moods";
import type { TrackerData, Category, TodoItem, HabitStatus } from "@/types";

// 支持自定义输入的Select组件
function SelectWithCustom({
  value,
  onValueChange,
  options,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: Category[];
}) {
  const [customOptions, setCustomOptions] = useState<Category[]>(() => {
    const saved = localStorage.getItem("custom-secondary-categories");
    return saved ? JSON.parse(saved) : [];
  });
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [newOption, setNewOption] = useState("");

  const allOptions = [...options, ...customOptions];

  const saveCustomOptions = (updated: Category[]) => {
    setCustomOptions(updated);
    localStorage.setItem("custom-secondary-categories", JSON.stringify(updated));
  };

  const handleAddCustom = () => {
    if (newOption.trim()) {
      const newCat: Category = {
        key: `custom-${Date.now()}`,
        label: newOption.trim(),
      };
      const updated = [...customOptions, newCat];
      saveCustomOptions(updated);
      onValueChange(newCat.key);
      setNewOption("");
    }
  };

  const handleDelete = (key: string) => {
    const updated = customOptions.filter((c) => c.key !== key);
    saveCustomOptions(updated);
    if (value === key) {
      onValueChange("");
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...customOptions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    saveCustomOptions(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === customOptions.length - 1) return;
    const updated = [...customOptions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    saveCustomOptions(updated);
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex gap-2 w-full">
        <Select value={value ?? ""} onValueChange={onValueChange} className="flex-1 min-w-0 w-full">
          <SelectTrigger className="rounded-2xl w-full">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {allOptions.length > 0 ? (
              allOptions.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                暂无选项，请添加自定义选项
              </div>
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-2xl flex-shrink-0"
          onClick={() => setManageDialogOpen(true)}
          title="管理分类选项"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Dialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        title="管理分类选项"
      >
        <div className="space-y-4">
          {/* 添加新选项 */}
          <div className="space-y-2">
            <Label>添加新选项</Label>
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="输入新选项名称"
                className="flex-1 rounded-2xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustom();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddCustom}
                className="rounded-2xl"
              >
                添加
              </Button>
            </div>
          </div>

          {/* 自定义选项列表 */}
          {customOptions.length > 0 && (
            <div className="space-y-2">
              <Label>自定义选项</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customOptions.map((option, index) => (
                  <div
                    key={option.key}
                    className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm">{option.label}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="上移"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === customOptions.length - 1}
                        title="下移"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(option.key)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 默认选项（只读） */}
          {options.length > 0 && (
            <div className="space-y-2">
              <Label>默认选项</Label>
              <div className="space-y-1">
                {options.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <span className="flex-1 text-sm text-muted-foreground">{option.label}</span>
                    <span className="text-xs text-muted-foreground">默认</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setManageDialogOpen(false);
                setNewOption("");
              }}
              className="rounded-2xl"
            >
              关闭
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

interface RecordTabProps {
  data: TrackerData;
  setData: React.Dispatch<React.SetStateAction<TrackerData>>;
  selectedDate: string;
}

export function RecordTab({
  data,
  setData,
  selectedDate,
}: RecordTabProps) {
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [editingMoodNote, setEditingMoodNote] = useState(false);
  const [moodNoteInput, setMoodNoteInput] = useState("");

  const tasksToday = data.tasksByDate?.[selectedDate] ?? [];
  const moodToday = data.moodByDate?.[selectedDate]?.mood ?? "";
  const moodNoteToday = data.moodByDate?.[selectedDate]?.note ?? "";

  // 当选中日期变化时，同步心情备注输入框
  useEffect(() => {
    setMoodNoteInput(moodNoteToday);
    setEditingMoodNote(false);
  }, [selectedDate, moodNoteToday]);

  // task form
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("1");
  const [primary, setPrimary] = useState(PRIMARY_CATEGORIES[0].key);
  const [secondary, setSecondary] = useState("");

  // when selecting date, keep baseDate close
  useEffect(() => {
    const d = new Date(selectedDate);
    if (!Number.isNaN(d.valueOf())) setBaseDate(d);
  }, [selectedDate]);

  const toggleHabit = (dateKey: string, onStatusChanged?: (newStatus: HabitStatus) => void) => {
    setData((prev) => {
      const next = { ...prev, habitChecks: { ...(prev.habitChecks || {}) } };
      const currentRecord = next.habitChecks[dateKey] || { status: "none" as const, note: "" };
      const statusCycle: Array<"none" | "green" | "red"> = ["none", "green", "red"];
      const currentIndex = statusCycle.indexOf(currentRecord.status);
      const nextIndex = (currentIndex + 1) % statusCycle.length;
      const newStatus = statusCycle[nextIndex];
      next.habitChecks[dateKey] = {
        status: newStatus,
        note: currentRecord.note,
      };
      // 调用回调，通知新状态
      if (onStatusChanged) {
        onStatusChanged(newStatus);
      }
      return next;
    });
  };

  const updateHabitNote = (dateKey: string, note: string) => {
    setData((prev) => {
      const next = { ...prev, habitChecks: { ...(prev.habitChecks || {}) } };
      const currentRecord = next.habitChecks[dateKey] || { status: "none" as const, note: "" };
      next.habitChecks[dateKey] = {
        status: currentRecord.status,
        note: note,
      };
      return next;
    });
  };

  const addTask = () => {
    const h = clamp(Number(hours), 0, 24);
    if (!title.trim()) return;

    setData((prev) => {
      const next = { ...prev, tasksByDate: { ...(prev.tasksByDate || {}) } };
      const list = [...(next.tasksByDate[selectedDate] || [])];
      list.unshift({
        id: uid(),
        title: title.trim(),
        hours: h,
        primary,
        secondary,
        details: "",
      });
      next.tasksByDate[selectedDate] = list;
      return next;
    });

    setTitle("");
    setHours("1");
  };

  const removeTask = (id: string) => {
    setData((prev) => {
      const next = { ...prev, tasksByDate: { ...(prev.tasksByDate || {}) } };
      next.tasksByDate[selectedDate] = (
        next.tasksByDate[selectedDate] || []
      ).filter((t) => t.id !== id);
      return next;
    });
  };

  const saveMood = (mood: string, note: string) => {
    setData((prev) => {
      const next = { ...prev, moodByDate: { ...(prev.moodByDate || {}) } };
      next.moodByDate[selectedDate] = { mood, note };
      return next;
    });
  };

  const handleHabitSettingsChange = (name: string, startDate: string, endDate: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        habitSettings: { name, startDate, endDate },
      };
      
      // 如果习惯名称、开始日期和结束日期都有值，则添加到习惯列表
      if (name && name.trim() && name !== "习惯" && startDate && endDate) {
        const habits = prev.habits || [];
        // 检查是否已存在相同的习惯（通过名称、开始日期和结束日期判断）
        const existingHabit = habits.find(
          (h) => h.name === name.trim() && h.startDate === startDate && h.endDate === endDate
        );
        
        // 如果不存在，则添加新习惯
        if (!existingHabit) {
          const newHabit: Habit = {
            id: uid(),
            name: name.trim(),
            startDate,
            endDate,
            createdAt: formatDate(new Date()),
          };
          next.habits = [...habits, newHabit];
        }
      }
      
      return next;
    });
  };

  const addTodo = (title: string) => {
    setData((prev) => {
      const todos = prev.todos || [];
      const newTodo: TodoItem = {
        id: uid(),
        title,
        completed: false,
        createdAt: formatDate(new Date()),
      };
      return {
        ...prev,
        todos: [newTodo, ...todos],
      };
    });
  };

  const toggleTodo = (id: string) => {
    setData((prev) => {
      const todos = prev.todos || [];
      return {
        ...prev,
        todos: todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      };
    });
  };

  const removeTodo = (id: string) => {
    setData((prev) => {
      const todos = prev.todos || [];
      return {
        ...prev,
        todos: todos.filter((todo) => todo.id !== id),
      };
    });
  };

  const todaysTotal = useMemo(
    () => fmtHours(sumHours(tasksToday)),
    [tasksToday]
  );
  const habitDone = data.habitChecks?.[selectedDate]?.status === "green";

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatPill label="今日总耗时" value={`${todaysTotal} h`} sub="按事项累计" />
        <StatPill
          label="今日习惯完成"
          value={habitDone ? "已完成" : "未完成"}
        />
        <StatPill
          label="今日心情"
          value={
            moodToday
              ? MOODS.find((m) => m.key === moodToday)?.label ?? "已记录"
              : "未记录"
          }
          sub={moodNoteToday || undefined}
        />
      </div>

      {/* 近期习惯和长期待办 */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <WeekStrip
            baseDate={baseDate}
            habitChecks={data.habitChecks || {}}
            onToggleHabit={toggleHabit}
            onUpdateHabitNote={updateHabitNote}
            onPrev={() => setBaseDate((d) => addDays(d, -7))}
            onNext={() => setBaseDate((d) => addDays(d, 7))}
            habitName={data.habitSettings?.name}
            habitStartDate={data.habitSettings?.startDate}
            habitEndDate={data.habitSettings?.endDate}
            onHabitSettingsChange={handleHabitSettingsChange}
          />
        </div>
        <div className="lg:col-span-1">
          <TodoList
            todos={data.todos || []}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
        </div>
      </div>

      {/* 今日事项 */}
      <TaskList 
        tasks={tasksToday} 
        onRemove={removeTask}
        moodToday={moodToday}
        moodNoteToday={moodNoteToday}
      />

      {/* 新增事项和心情记录 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* left: add task */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">新增记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Tabs value={primary} onValueChange={setPrimary} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-2xl">
                  {PRIMARY_CATEGORIES.slice(0, 3).map((c) => (
                    <TabsTrigger key={c.key} value={c.key} className="rounded-2xl">
                      {c.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="grid gap-2">
              <Label>事项</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  primary === "external"
                    ? "外部驱动的任务。比如学校任务、工作事务、生活杂事等"
                    : primary === "study"
                    ? "自发任务，长期成长。比如代码项目、AI进展/见解/原理学习、英语学习等"
                    : primary === "health"
                    ? "跑步、增肌、冥想等"
                    : "比如：跑步 / 复盘 / 学习 / 家庭活动..."
                }
                className="rounded-2xl"
              />
            </div>

            <div className="flex gap-3">
              <div className="grid gap-2 flex-1 min-w-0">
                <Label>完成时间（小时）</Label>
                <Input
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  type="number"
                  min={0}
                  max={24}
                  step={0.1}
                  className="rounded-2xl"
                />
              </div>
              <div className="grid gap-2 flex-1 min-w-0">
                <Label>分类</Label>
                <SelectWithCustom
                  value={secondary}
                  onValueChange={setSecondary}
                  options={SECONDARY_CATEGORIES}
                />
              </div>
            </div>

            <Button onClick={addTask} className="w-full rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              添加到 {selectedDate}
            </Button>
          </CardContent>
        </Card>

        {/* right: mood */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">心情记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              先选择整体状态（可量表化），再补充一句话。
            </div>

            <MoodPicker
              value={moodToday}
              onChange={(m) => saveMood(m, moodNoteToday)}
            />

            <div className="grid gap-2">
              <Label>心情备注（可选）</Label>
              {editingMoodNote ? (
                <>
                  <Textarea
                    value={moodNoteInput}
                    onChange={(e) => setMoodNoteInput(e.target.value)}
                    placeholder="比如：今天专注/焦虑/很松弛..."
                    className="min-h-[110px] rounded-2xl"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMoodNoteInput(moodNoteToday);
                        setEditingMoodNote(false);
                      }}
                      className="rounded-2xl"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={() => {
                        saveMood(moodToday, moodNoteInput.trim());
                        setEditingMoodNote(false);
                      }}
                      className="rounded-2xl"
                    >
                      保存
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[110px] rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-muted-foreground">
                    {moodNoteToday || "暂无备注"}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMoodNoteInput(moodNoteToday);
                        setEditingMoodNote(true);
                      }}
                      className="rounded-2xl"
                    >
                      {moodNoteToday ? "编辑" : "添加备注"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



