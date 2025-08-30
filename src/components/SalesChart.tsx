import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

// Theme-aware custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 border border-border backdrop-blur-md rounded-md p-3 shadow-md">
        <p className="font-semibold mb-2 text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.stroke }}>
            {entry.name}: {
              entry.dataKey === "revenue"
                ? `₹${entry.value.toLocaleString()}`
                : entry.value
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SalesChart() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Create observer for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Dynamic colors based on theme
  const textColor = isDark ? "#d1d5db" : "#6b7280";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  return (
    <div className="h-96">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Monthly Performance Overview</h3>
        <p className="text-sm text-muted-foreground">Revenue, properties sold, and new leads generated per month.</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 12 }}
            dy={10}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
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
