import { useState, useMemo } from "react";
import { Plus, Trash2, CalendarPlus, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uid } from "@/utils/helpers";
import type { WeeklyTask, WeekStatus } from "@/types";

interface WeeklyTaskTrackerProps {
  tasks: WeeklyTask[];
  onTasksChange: (tasks: WeeklyTask[]) => void;
}

// 状态颜色映射
const statusColors: Record<WeekStatus, string> = {
  none: "bg-gray-100 border-gray-200",
  green: "bg-green-500 border-green-600",
  yellow: "bg-yellow-500 border-yellow-600",
  red: "bg-red-500 border-red-600",
};

// 状态循环顺序
const statusCycle: WeekStatus[] = ["none", "green", "yellow", "red"];

// 获取下一个状态
function getNextStatus(current: WeekStatus): WeekStatus {
  const currentIndex = statusCycle.indexOf(current);
  const nextIndex = (currentIndex + 1) % statusCycle.length;
  return statusCycle[nextIndex];
}

// 获取周数显示文本（1st, 2nd, 3rd, 4th...）
function getWeekLabel(weekNumber: number): string {
  const lastDigit = weekNumber % 10;
  const lastTwoDigits = weekNumber % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${weekNumber}th`;
  }
  
  switch (lastDigit) {
    case 1:
      return `${weekNumber}st`;
    case 2:
      return `${weekNumber}nd`;
    case 3:
      return `${weekNumber}rd`;
    default:
      return `${weekNumber}th`;
  }
}

export function WeeklyTaskTracker({ tasks, onTasksChange }: WeeklyTaskTrackerProps) {
  const [editingWeek, setEditingWeek] = useState<{
    taskId: string;
    weekNumber: number;
  } | null>(null);
  const [editNote, setEditNote] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);
  // 获取任务的最大周数
  const getTaskMaxWeek = (task: WeeklyTask): number => {
    const weekNumbers = Object.keys(task.weeks || {}).map(Number);
    return Math.max(4, weekNumbers.length > 0 ? Math.max(...weekNumbers) : 0);
  };

  // 获取所有任务中的最大周数（用于表头显示）
  const maxWeek = useMemo(() => {
    if (tasks.length === 0) return 4;
    return Math.max(
      4,
      ...tasks.map((task) => getTaskMaxWeek(task))
    );
  }, [tasks]);

  // 切换周状态
  const toggleWeekStatus = (taskId: string, weekNumber: number) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) return task;

      const updatedWeeks = { ...(task.weeks || {}) };
      const currentRecord = updatedWeeks[weekNumber] || { status: "none" as WeekStatus, note: "" };
      const nextStatus = getNextStatus(currentRecord.status);

      updatedWeeks[weekNumber] = {
        status: nextStatus,
        note: currentRecord.note,
      };

      return {
        ...task,
        weeks: updatedWeeks,
      };
    });

    onTasksChange(updatedTasks);
  };

  // 打开编辑对话框
  const openEditDialog = (taskId: string, weekNumber: number) => {
    // 清除单击超时，避免触发单击事件
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    const task = tasks.find((t) => t.id === taskId);
    const record = task?.weeks?.[weekNumber] || { status: "none" as WeekStatus, note: "" };
    setEditNote(record.note);
    setEditingWeek({ taskId, weekNumber });
  };

  // 处理单击事件（带延迟，以便检测双击）
  const handleClick = (taskId: string, weekNumber: number) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    const timeout = setTimeout(() => {
      toggleWeekStatus(taskId, weekNumber);
      setClickTimeout(null);
    }, 200); // 200ms 延迟，如果在这期间有双击，则取消
    setClickTimeout(timeout);
  };

  // 保存编辑的备注
  const saveEditNote = () => {
    if (!editingWeek) return;

    const updatedTasks = tasks.map((task) => {
      if (task.id !== editingWeek.taskId) return task;

      const updatedWeeks = { ...(task.weeks || {}) };
      const currentRecord = updatedWeeks[editingWeek.weekNumber] || {
        status: "none" as WeekStatus,
        note: "",
      };

      updatedWeeks[editingWeek.weekNumber] = {
        status: currentRecord.status,
        note: editNote.trim(),
      };

      return {
        ...task,
        weeks: updatedWeeks,
      };
    });

    onTasksChange(updatedTasks);
    setEditingWeek(null);
    setEditNote("");
  };

  // 添加新任务
  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: WeeklyTask = {
      id: uid(),
      title: newTaskTitle.trim(),
      weeks: {},
      createdAt: new Date().toISOString(),
    };

    onTasksChange([...tasks, newTask]);
    setNewTaskTitle("");
  };

  // 删除任务
  const deleteTask = (taskId: string) => {
    if (confirm("确定要删除这个任务吗？")) {
      onTasksChange(tasks.filter((t) => t.id !== taskId));
    }
  };

  // 为指定任务添加一周
  const addWeek = (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) return task;

      const currentMaxWeek = getTaskMaxWeek(task);
      const newWeekNumber = currentMaxWeek + 1;
      
      // 添加新的一周，状态为 none
      const updatedWeeks = { ...(task.weeks || {}) };
      updatedWeeks[newWeekNumber] = {
        status: "none" as WeekStatus,
        note: "",
      };

      return {
        ...task,
        weeks: updatedWeeks,
      };
    });

    onTasksChange(updatedTasks);
  };

  // 获取周的状态
  const getWeekStatus = (task: WeeklyTask, weekNumber: number): WeekStatus => {
    return task.weeks?.[weekNumber]?.status || "none";
  };

  // 获取周的备注
  const getWeekNote = (task: WeeklyTask, weekNumber: number): string => {
    return task.weeks?.[weekNumber]?.note || "";
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">每周任务跟踪</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 添加新任务 */}
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="输入任务标题..."
            className="rounded-2xl"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addTask();
              }
            }}
          />
          <Button onClick={addTask} className="rounded-2xl flex-shrink-0 whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            添加任务
          </Button>
        </div>

        {/* 任务列表 */}
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无任务，点击上方添加新任务开始记录
          </div>
        ) : (
          <div className="space-y-4">
            {/* 表头 */}
            <div className="grid grid-cols-[1fr_auto] gap-2 pb-2 border-b">
              <div className="font-medium text-sm">任务标题</div>
              <div className="flex gap-2 overflow-x-auto">
                {Array.from({ length: maxWeek }, (_, i) => i + 1).map((weekNum) => (
                  <div
                    key={weekNum}
                    className="min-w-[60px] text-center text-xs font-medium text-muted-foreground"
                  >
                    {getWeekLabel(weekNum)}
                  </div>
                ))}
                <div className="min-w-[40px]"></div>
                <div className="min-w-[40px]"></div>
              </div>
            </div>

            {/* 任务行 */}
            {tasks.map((task) => {
              const taskMaxWeek = getTaskMaxWeek(task);
              
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[1fr_auto] gap-2 items-start py-3 border-b last:border-b-0"
                >
                  {/* 任务标题 */}
                  <div className="font-medium text-sm truncate">{task.title}</div>

                  {/* 周状态块 */}
                  <div className="flex gap-2 overflow-x-auto">
                    {Array.from({ length: taskMaxWeek }, (_, i) => i + 1).map((weekNum) => {
                      const status = getWeekStatus(task, weekNum);
                      const note = getWeekNote(task, weekNum);
                      const hasNote = note.trim().length > 0;

                      return (
                        <div
                          key={weekNum}
                          className="flex flex-col items-center gap-1.5 min-w-[60px]"
                        >
                          <button
                            onClick={() => handleClick(task.id, weekNum)}
                            onDoubleClick={() => openEditDialog(task.id, weekNum)}
                            className={`w-12 h-12 rounded-xl border-2 transition-all hover:shadow-lg hover:border-opacity-80 active:scale-95 flex items-center justify-center ${statusColors[status]}`}
                            title={`单击切换状态，双击编辑备注${hasNote ? `\n备注: ${note}` : ""}`}
                          >
                            {status === "green" && (
                              <Check className="h-6 w-6 text-white stroke-[3]" />
                            )}
                            {status === "red" && (
                              <X className="h-6 w-6 text-white stroke-[3]" />
                            )}
                          </button>
                          {hasNote && (
                            <div className="text-xs text-muted-foreground text-center max-w-[60px] break-words">
                              {note}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 添加周按钮 */}
                    <button
                      onClick={() => addWeek(task.id)}
                      className="min-w-[40px] h-12 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-xl transition"
                      title="添加一周"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="min-w-[40px] h-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition"
                      title="删除任务"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 说明文字 */}
        <div className="text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>单击周状态块切换状态：</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border-2 bg-gray-100 border-gray-200"></span>
              <span>无</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border-2 bg-green-500 border-green-600"></span>
              <span>已完成</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border-2 bg-yellow-500 border-yellow-600"></span>
              <span>没做完</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded border-2 bg-red-500 border-red-600"></span>
              <span>没动</span>
            </div>
            <span>，双击可编辑完成情况备注</span>
          </div>
        </div>
      </CardContent>

      {/* 编辑备注对话框 */}
      <Dialog
        open={editingWeek !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingWeek(null);
            setEditNote("");
          }
        }}
        title={`编辑第 ${editingWeek ? getWeekLabel(editingWeek.weekNumber) : ""} 周完成情况`}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>完成情况备注（最多20字）</Label>
            <Textarea
              value={editNote}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 20) {
                  setEditNote(value);
                }
              }}
              placeholder="输入本周的具体完成情况..."
              className="min-h-[100px] rounded-2xl"
              maxLength={20}
              autoFocus
            />
            <div className="text-xs text-muted-foreground text-right">
              {editNote.length}/20
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingWeek(null);
                setEditNote("");
              }}
              className="rounded-2xl"
            >
              取消
            </Button>
            <Button onClick={saveEditNote} className="rounded-2xl">
              保存
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
