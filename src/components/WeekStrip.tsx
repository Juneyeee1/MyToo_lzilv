import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Settings, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatMMDD, addDays, parseDate } from "@/utils/date";
import type { HabitRecord, HabitStatus } from "@/types";

interface WeekStripProps {
  baseDate: Date;
  habitChecks: Record<string, HabitRecord>;
  onToggleHabit: (dateKey: string, onStatusChanged?: (newStatus: HabitStatus) => void) => void;
  onUpdateHabitNote: (dateKey: string, note: string) => void;
  onPrev: () => void;
  onNext: () => void;
  habitName?: string;
  habitStartDate?: string;
  habitEndDate?: string;
  onHabitSettingsChange?: (name: string, startDate: string, endDate: string) => void;
}

// 状态颜色映射
const statusColors: Record<HabitStatus, string> = {
  none: "bg-gray-100 border-gray-200",
  green: "bg-green-500 border-green-600",
  red: "bg-red-500 border-red-600",
};

export function WeekStrip({
  baseDate,
  habitChecks,
  onToggleHabit,
  onUpdateHabitNote,
  onPrev,
  onNext,
  habitName = "习惯",
  habitStartDate = "",
  habitEndDate = "",
  onHabitSettingsChange,
}: WeekStripProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [name, setName] = useState(habitName);
  const [startDate, setStartDate] = useState(habitStartDate);
  const [endDate, setEndDate] = useState(habitEndDate);
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);

  // 计算以baseDate为中心的一周（前后各3天）
  const today = new Date();
  const todayKey = formatDate(today);
  const start = useMemo(() => addDays(baseDate, -3), [baseDate]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    [start]
  );

  // 当对话框打开时，同步本地状态与 props
  useEffect(() => {
    if (settingsOpen) {
      setName(habitName);
      setStartDate(habitStartDate);
      setEndDate(habitEndDate);
    }
  }, [settingsOpen, habitName, habitStartDate, habitEndDate]);

  // 组件卸载时清理超时
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  // 打开编辑对话框
  const openEditDialog = (dateKey: string) => {
    // 清除单击超时，避免触发单击事件
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    const normalizedKey = normalizeDateKey(dateKey);
    // 同时检查原始键和标准化键
    const record = habitChecks[normalizedKey] || habitChecks[dateKey] || { status: "none" as HabitStatus, note: "" };
    setEditNote(record.note);
    // 使用标准化后的键
    setEditingDate(normalizedKey);
  };

  // 处理单击事件（带延迟，以便检测双击）
  const handleClick = (dateKey: string) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    const timeout = setTimeout(() => {
      // 标准化日期键
      const normalizedKey = normalizeDateKey(dateKey);
      // 切换状态，并在状态更新后检查是否需要打开编辑对话框
      onToggleHabit(normalizedKey, (newStatus) => {
        // 如果切换到未完成状态（red），自动打开备注输入弹窗
        if (newStatus === "red") {
          // 使用useEffect来确保状态已经更新，但这里我们直接使用回调中的新状态
          // 延迟一下，确保React状态已经更新
          setTimeout(() => {
            // 从最新的habitChecks获取备注，如果还没有则使用空字符串
            const record = habitChecks[normalizedKey] || habitChecks[dateKey];
            setEditNote(record?.note || "");
            setEditingDate(normalizedKey);
          }, 100);
        }
      });
      setClickTimeout(null);
    }, 200); // 200ms 延迟，如果在这期间有双击，则取消
    setClickTimeout(timeout);
  };

  // 保存编辑的备注
  const saveEditNote = () => {
    if (!editingDate) return;
    // 确保使用标准化后的日期键
    const normalizedKey = normalizeDateKey(editingDate);
    onUpdateHabitNote(normalizedKey, editNote.trim());
    setEditingDate(null);
    setEditNote("");
    // 清除可能存在的单击超时
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
  };

  const handleSaveSettings = () => {
    if (onHabitSettingsChange) {
      onHabitSettingsChange(name, startDate, endDate);
    }
    setSettingsOpen(false);
  };

  // 标准化日期键格式（处理可能的旧格式数据）
  const normalizeDateKey = (dateKey: string): string => {
    // 如果已经是YYYY-MM-DD格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return dateKey;
    }
    // 如果是MM-DD格式，转换为YYYY-MM-DD（假设是当前年份）
    if (/^\d{2}-\d{2}$/.test(dateKey)) {
      const [month, day] = dateKey.split('-');
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    }
    // 如果是MM.DD格式，转换为YYYY-MM-DD（假设是当前年份）
    if (/^\d{2}\.\d{2}$/.test(dateKey)) {
      const [month, day] = dateKey.split('.');
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    }
    // 其他格式，尝试解析
    try {
      const d = parseDate(dateKey);
      return formatDate(d);
    } catch {
      return dateKey;
    }
  };

  // 获取日期的状态（支持多种日期格式）
  const getHabitStatus = (dateKey: string): HabitStatus => {
    const normalizedKey = normalizeDateKey(dateKey);
    // 同时检查原始键和标准化键
    return habitChecks[normalizedKey]?.status || habitChecks[dateKey]?.status || "none";
  };

  // 获取日期的备注（支持多种日期格式）
  const getHabitNote = (dateKey: string): string => {
    const normalizedKey = normalizeDateKey(dateKey);
    // 同时检查原始键和标准化键
    return habitChecks[normalizedKey]?.note || habitChecks[dateKey]?.note || "";
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        {habitName && habitName.trim() && habitName !== "习惯" && (
          <CardTitle className="mb-3">{habitName}</CardTitle>
        )}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            今天: {todayKey}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="flex items-start justify-between gap-2 overflow-x-auto pb-1"
        >
          {days.map((d) => {
            const key = formatDate(d);
            const status = getHabitStatus(key);
            const note = getHabitNote(key);
            const isToday = key === todayKey;
            const hasNote = note.trim().length > 0;

            return (
              <div
                key={key}
                className="flex flex-col items-center min-w-[72px]"
              >
                <div
                  className={`relative w-full rounded-2xl border-2 p-3 text-center bg-white ${
                    isToday
                      ? "border-black border-4"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">
                    {formatMMDD(d)}
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  
                  {/* 颜色块放在日期下方 */}
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClick(key);
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditDialog(key);
                      }}
                      className={`w-10 h-10 rounded-xl border-2 transition-all hover:shadow-lg hover:border-opacity-80 active:scale-95 flex items-center justify-center ${statusColors[status]}`}
                      title="单击切换状态，双击编辑备注"
                    >
                      {status === "green" && (
                        <Check className="h-5 w-5 text-white stroke-[3]" />
                      )}
                      {status === "red" && (
                        <X className="h-5 w-5 text-white stroke-[3]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 备注显示在日期组件下方，不包在组件内 */}
                {hasNote && (
                  <div className="mt-2 text-xs text-muted-foreground text-center max-w-[72px] break-words line-clamp-2">
                    {note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          单击颜色块切换状态，双击编辑完成情况或未完成原因。
        </div>
      </CardContent>

      <Dialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="习惯设置"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>习惯名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入习惯名称"
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-2">
            <Label>养成起始时间</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-2">
            <Label>养成结束时间</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="rounded-2xl"
            >
              取消
            </Button>
            <Button onClick={handleSaveSettings} className="rounded-2xl">
              保存
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={editingDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDate(null);
            setEditNote("");
            // 清除可能存在的单击超时
            if (clickTimeout) {
              clearTimeout(clickTimeout);
              setClickTimeout(null);
            }
          }
        }}
        title={`编辑 ${editingDate ? formatDate(parseDate(editingDate)) : ""} 完成情况`}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>完成情况或未完成原因（最多20字）</Label>
            <Textarea
              value={editNote}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 20) {
                  setEditNote(value);
                }
              }}
              placeholder="输入完成情况或未完成原因..."
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
                setEditingDate(null);
                setEditNote("");
                // 清除可能存在的单击超时
                if (clickTimeout) {
                  clearTimeout(clickTimeout);
                  setClickTimeout(null);
                }
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
