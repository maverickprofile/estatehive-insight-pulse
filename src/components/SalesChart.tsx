import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", sales: 2400000, target: 2000000 },
  { month: "Feb", sales: 1800000, target: 2200000 },
  { month: "Mar", sales: 3200000, target: 2400000 },
  { month: "Apr", sales: 2800000, target: 2600000 },
  { month: "May", sales: 3800000, target: 2800000 },
  { month: "Jun", sales: 3400000, target: 3000000 },
  { month: "Jul", sales: 4200000, target: 3200000 },
  { month: "Aug", sales: 3900000, target: 3400000 },
  { month: "Sep", sales: 4800000, target: 3600000 },
  { month: "Oct", sales: 4500000, target: 3800000 },
  { month: "Nov", sales: 5200000, target: 4000000 },
  { month: "Dec", sales: 5800000, target: 4200000 },
];

const formatCurrency = (value: number) => {
  return `₹${(value / 100000).toFixed(1)}L`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className={`text-sm`} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SalesChart() {
  return (
    <div className="metric-card h-80">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Monthly Sales Trend</h3>
        <p className="text-sm text-muted-foreground">Sales vs Target (₹ Lakhs)</p>
      </div>
      
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            className="text-muted-foreground"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            name="Sales"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
            name="Target"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}