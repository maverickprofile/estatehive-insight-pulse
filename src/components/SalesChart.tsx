import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

// Admin dashboard chart data
const salesData = [
  { month: "Aug '24", revenue: 2800000, propertiesSold: 5, newLeads: 120 },
  { month: "Sep '24", revenue: 3500000, propertiesSold: 7, newLeads: 140 },
  { month: "Oct '24", revenue: 3200000, propertiesSold: 6, newLeads: 130 },
  { month: "Nov '24", revenue: 4100000, propertiesSold: 8, newLeads: 160 },
  { month: "Dec '24", revenue: 5500000, propertiesSold: 11, newLeads: 180 },
  { month: "Jan '25", revenue: 4800000, propertiesSold: 9, newLeads: 170 },
  { month: "Feb '25", revenue: 4500000, propertiesSold: 8, newLeads: 165 },
  { month: "Mar '25", revenue: 6000000, propertiesSold: 12, newLeads: 200 },
  { month: "Apr '25", revenue: 5800000, propertiesSold: 11, newLeads: 190 },
  { month: "May '25", revenue: 6500000, propertiesSold: 14, newLeads: 220 },
  { month: "Jun '25", revenue: 7200000, propertiesSold: 15, newLeads: 240 },
  { month: "Jul '25", revenue: 6800000, propertiesSold: 13, newLeads: 230 },
];

// Format for Y-axis currency labels
const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString()}`;
};

// Dark theme custom tooltip
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f1f1f]/90 border border-border backdrop-blur-md rounded-md p-3 shadow-md text-white">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.stroke }}>
            {entry.name}: {
              (entry.dataKey as string) === "revenue"
                ? `₹${Number(entry.value).toLocaleString()}`
                : entry.value
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};
export default function SalesChart({ range }: { range: "7d" | "30d" | "ytd" }) {
  let data = salesData;
  if (range === "7d") data = salesData.slice(-1);
  else if (range === "30d") data = salesData.slice(-3);

  return (
    <div className="rounded-lg overflow-hidden shadow-inner">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#d1d5db", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
            tick={{ fill: "#d1d5db", fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#d1d5db", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "white", paddingTop: "20px" }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            fill="url(#colorRevenue)"
            strokeWidth={2}
            name="Revenue (₹)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="newLeads"
            stroke="#22c55e"
            fill="url(#colorLeads)"
            strokeWidth={2}
            name="New Leads"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
