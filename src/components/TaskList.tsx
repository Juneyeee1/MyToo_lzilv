import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_CATEGORIES, SECONDARY_CATEGORIES } from "@/constants/categories";
import { MOODS } from "@/constants/moods";
import type { Task } from "@/types";
import { sumHours, fmtHours } from "@/utils/helpers";
import { groupTasksByPrimary } from "@/utils/data";

interface TaskListProps {
  tasks: Task[];
  onRemove: (id: string) => void;
  moodToday?: string;
  moodNoteToday?: string;
}

// 获取所有自定义的secondary categories
const getAllSecondaryCategories = () => {
  const saved = localStorage.getItem("custom-secondary-categories");
  const custom = saved ? JSON.parse(saved) : [];
  return [...SECONDARY_CATEGORIES, ...custom];
};

// 可折叠的任务组组件（用于外部任务和个人成长）
function CollapsibleTaskGroup({
  categoryLabel,
  tasks,
  onRemove,
}: {
  categoryLabel: string;
  tasks: Task[];
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const allSecondary = getAllSecondaryCategories();

  // 按 secondary 分组
  const groupedBySecondary = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.secondary;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const totalHours = fmtHours(sumHours(tasks));

  return (
    <div className="h-full rounded-2xl border bg-white p-4">
      {/* 标题、总时长 */}
      <div className="mb-3">
        <div className="text-sm font-medium">{categoryLabel}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          总时长: {totalHours} h
        </div>
      </div>
      
      {/* 类型1列表 - 默认显示 */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-xs text-muted-foreground">暂无事项</div>
        ) : (
          Array.from(groupedBySecondary.entries()).map(([secondaryKey, groupTasks]) => {
            const secondary = allSecondary.find((c) => c.key === secondaryKey);
            const isExpanded = expanded === secondaryKey;
            const groupTotalHours = fmtHours(sumHours(groupTasks));

            return (
              <div key={secondaryKey}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : secondaryKey)}
                  className="flex w-full items-center justify-between rounded-lg border bg-gray-50 p-2 text-left hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {secondary?.label || secondaryKey}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {groupTotalHours} h
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                {/* 展开后显示具体事项和对应时间 */}
                {isExpanded && (
                  <div className="mt-2 space-y-2 pl-4">
                    {groupTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-white p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{task.title}</div>
                          {task.details && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {task.details}
                            </div>
                          )}
                          <div className="mt-1 text-xs text-muted-foreground">
                            {task.hours} 小时
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => onRemove(task.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 简单的任务组组件（用于运动&健康）
function SimpleTaskGroup({
  categoryLabel,
  tasks,
  onRemove,
}: {
  categoryLabel: string;
  tasks: Task[];
  onRemove: (id: string) => void;
}) {
  const allSecondary = getAllSecondaryCategories();
  const totalHours = fmtHours(sumHours(tasks));

  return (
    <div className="h-full rounded-2xl border bg-white p-4">
      {/* 标题、总时长 */}
      <div className="mb-3">
        <div className="text-sm font-medium">{categoryLabel}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          总时长: {totalHours} h
        </div>
      </div>
      
      {/* 事项列表 */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-xs text-muted-foreground">暂无事项</div>
        ) : (
          tasks.map((task) => {
            const secondary = allSecondary.find((c) => c.key === task.secondary);
            return (
              <div
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-lg border bg-gray-50 p-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{task.title}</div>
                    <Badge variant="secondary" className="text-xs">
                      {secondary?.label || task.secondary}
                    </Badge>
                  </div>
                  {task.details && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {task.details}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {task.hours} 小时
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => onRemove(task.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 心情组件
function MoodDisplay({ moodToday, moodNoteToday }: { moodToday?: string; moodNoteToday?: string }) {
  const mood = moodToday ? MOODS.find((m) => m.key === moodToday) : null;

  return (
    <div className="h-full rounded-2xl border bg-white p-4">
      <div className="text-sm font-medium">心情</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {mood ? mood.label : "未记录"}
      </div>
      {moodNoteToday && (
        <div className="mt-2 text-xs text-muted-foreground">
          {moodNoteToday}
        </div>
      )}
    </div>
  );
}

export function TaskList({ tasks, onRemove, moodToday, moodNoteToday }: TaskListProps) {
  const grouped = groupTasksByPrimary(tasks);

  const externalTasks = grouped.get("external") || [];
  const studyTasks = grouped.get("study") || [];
  const healthTasks = grouped.get("health") || [];

  return (
    <div className="space-y-4">
      {/* 外部任务和个人成长横向排列并用一个背景框住 */}
      <div className="rounded-2xl border bg-gray-50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CollapsibleTaskGroup
            categoryLabel="外部任务"
            tasks={externalTasks}
            onRemove={onRemove}
          />
          <CollapsibleTaskGroup
            categoryLabel="个人成长"
            tasks={studyTasks}
            onRemove={onRemove}
          />
        </div>
      </div>

      {/* 运动&健康和心情横向排列并用一个背景框住 */}
      <div className="rounded-2xl border bg-gray-50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SimpleTaskGroup
            categoryLabel="运动&健康"
            tasks={healthTasks}
            onRemove={onRemove}
          />
          <MoodDisplay moodToday={moodToday} moodNoteToday={moodNoteToday} />
        </div>
      </div>
    </div>
  );
}
