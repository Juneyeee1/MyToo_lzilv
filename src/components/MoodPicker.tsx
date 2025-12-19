import { MOODS } from "@/constants/moods";

interface MoodPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {MOODS.map((m) => {
        const Icon = m.icon;
        const active = value === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:shadow-sm ${
              active ? "bg-black text-white" : "bg-white"
            }`}
          >
            <div
              className={`rounded-xl border p-2 ${
                active ? "border-white/20" : ""
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-white" : ""}`} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{m.label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}





