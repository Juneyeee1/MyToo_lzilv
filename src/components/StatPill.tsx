import React from "react";

interface StatPillProps {
  label: string;
  value: string;
  sub?: string;
}

export function StatPill({ label, value, sub }: StatPillProps) {
  return (
    <div className="rounded-2xl border bg-white/60 p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {sub ? (
          <div className="pb-1 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </div>
    </div>
  );
}





