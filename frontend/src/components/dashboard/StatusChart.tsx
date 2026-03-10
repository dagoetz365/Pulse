import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusChartProps {
  active: number;
  critical: number;
  inactive: number;
  onSegmentClick?: (status: string) => void;
}

const COLORS = {
  active: "#0d9668",    /* teal-green — professional, calm */
  critical: "#dc2626",  /* warm red — urgency */
  inactive: "#d97706",  /* warm amber */
};

export function StatusChart({ active, critical, inactive, onSegmentClick }: StatusChartProps) {
  const data = [
    { name: "Active", value: active, color: COLORS.active, status: "active" },
    { name: "Critical", value: critical, color: COLORS.critical, status: "critical" },
    { name: "Inactive", value: inactive, color: COLORS.inactive, status: "inactive" },
  ].filter((d) => d.value > 0);

  const total = active + critical + inactive;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-6">
      <div className="w-[140px] h-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              className={onSegmentClick ? "cursor-pointer" : ""}
              onClick={(_: unknown, index: number) => {
                if (onSegmentClick && data[index]) {
                  onSegmentClick(data[index].status);
                }
              }}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} patients`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(30 8% 86%)",
                fontSize: "13px",
                backgroundColor: "#fff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5">
        {data.map((entry) => (
          <div
            key={entry.name}
            className={`flex items-center gap-2.5 ${onSegmentClick ? "cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors" : ""}`}
            onClick={() => onSegmentClick?.(entry.status)}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}</span>
            <span className="text-sm font-semibold text-foreground ml-auto tabular-nums">
              {entry.value}
            </span>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round((entry.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
