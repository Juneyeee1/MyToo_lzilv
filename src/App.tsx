import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecordTab } from "@/pages/RecordTab";
import { AnalyticsTab } from "@/pages/AnalyticsTab";
import { loadState, saveState, clearState } from "@/utils/storage";
import { buildDefaultData } from "@/utils/data";
import { formatDate } from "@/utils/date";
import type { TrackerData } from "@/types";

function App() {
  const [tab, setTab] = useState("record");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [data, setData] = useState<TrackerData>(() => {
    const loaded = loadState();
    return loaded ?? buildDefaultData();
  });

  const [selectedDate, setSelectedDate] = useState(() =>
    formatDate(new Date())
  );

  useEffect(() => {
    saveState(data);
  }, [data]);

  const handleReset = () => {
    clearState();
    setData(buildDefaultData());
    setSelectedDate(formatDate(new Date()));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">
              双轨笔记
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              划清外界任务，捍卫个人成长
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDatePickerOpen(true)}
              className="rounded-2xl border bg-white px-4 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="text-xs text-muted-foreground">当前选择日期</div>
              <div className="text-sm font-medium">{selectedDate}</div>
            </button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={handleReset}
            >
              重置数据
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="record" className="rounded-2xl">
              记录
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-2xl">
              长期追踪
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="mt-6">
            <RecordTab
              data={data}
              setData={setData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab data={data} setData={setData} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        title="选择日期"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>选择日期</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                if (newDate) {
                  setSelectedDate(newDate);
                  setDatePickerOpen(false);
                }
              }}
              className="rounded-2xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDatePickerOpen(false)}
              className="rounded-2xl"
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setSelectedDate(formatDate(new Date()));
                setDatePickerOpen(false);
              }}
              className="rounded-2xl"
            >
              今天
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default App;
