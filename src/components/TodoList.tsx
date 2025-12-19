import { useState } from "react";
import { Plus, X, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TodoItem } from "@/types";

interface TodoListProps {
  todos: TodoItem[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TodoList({ todos, onAdd, onToggle, onRemove }: TodoListProps) {
  const [newTodo, setNewTodo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newTodo.trim()) {
      onAdd(newTodo.trim());
      setNewTodo("");
      setIsAdding(false);
    }
  };

  const incompleteTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">长期待办</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 添加待办事项 */}
        {!isAdding ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-3 w-3" />
            添加待办
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="输入待办事项..."
              className="flex-1 rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTodo("");
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              className="rounded-xl whitespace-nowrap"
              onClick={handleAdd}
            >
              添加
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl whitespace-nowrap"
              onClick={() => {
                setIsAdding(false);
                setNewTodo("");
              }}
            >
              取消
            </Button>
          </div>
        )}

        {/* 待办事项列表 */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              暂无待办事项
            </div>
          ) : (
            <>
              {/* 未完成的待办 */}
              {incompleteTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-2 rounded-lg border bg-white p-2 hover:bg-gray-50"
                >
                  <button
                    onClick={() => onToggle(todo.id)}
                    className="mt-0.5 flex-shrink-0"
                    title="标记为完成"
                  >
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{todo.title}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => onRemove(todo.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* 已完成的待办 */}
              {completedTodos.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">已完成</div>
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-2 rounded-lg border bg-gray-50 p-2 opacity-60"
                    >
                      <button
                        onClick={() => onToggle(todo.id)}
                        className="mt-0.5 flex-shrink-0"
                        title="标记为未完成"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm line-through">{todo.title}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => onRemove(todo.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
