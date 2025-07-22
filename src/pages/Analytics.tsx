import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import MetricCard from "@/components/MetricCard";
import { IndianRupee, TrendingUp, Users, Building2, Target } from "lucide-react";

const monthlyData = [
  { month: "Jan", sales: 24000000, rentals: 1200000, leads: 45, conversions: 12 },
  { month: "Feb", sales: 18000000, rentals: 1400000, leads: 52, conversions: 15 },
  { month: "Mar", sales: 32000000, rentals: 1100000, leads: 68, conversions: 22 },
  { month: "Apr", sales: 28000000, rentals: 1600000, leads: 71, conversions: 18 },
  { month: "May", sales: 38000000, rentals: 1800000, leads: 89, conversions: 28 },
  { month: "Jun", sales: 34000000, rentals: 1500000, leads: 94, conversions: 31 },
];

const cityRevenue = [
  { name: "Mumbai", value: 45200000, color: "#059669" },
  { name: "Delhi", value: 38900000, color: "#EAB308" },
  { name: "Bangalore", value: 32100000, color: "#3B82F6" },
  { name: "Pune", value: 28700000, color: "#F59E0B" },
  { name: "Hyderabad", value: 24300000, color: "#8B5CF6" },
];

const conversionData = [
  { stage: "Leads", count: 450, color: "#3B82F6" },
  { stage: "Contacted", count: 380, color: "#EAB308" },
  { stage: "Site Visit", count: 220, color: "#8B5CF6" },
  { stage: "Negotiation", count: 120, color: "#F59E0B" },
  { stage: "Closed", count: 85, color: "#059669" },
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
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name.includes("sales") || entry.name.includes("rentals") 
              ? formatCurrency(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive insights into your real estate business performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value="₹18.5 Cr"
          change="+22% from last quarter"
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-primary"
        />
        <MetricCard
          title="Conversion Rate"
          value="18.9%"
          change="+2.3% from last month"
          changeType="positive"
          icon={Target}
          iconColor="text-success"
        />
        <MetricCard
          title="Active Leads"
          value="450"
          change="+15% from last month"
          changeType="positive"
          icon={Users}
          iconColor="text-accent"
        />
        <MetricCard
          title="Properties Sold"
          value="85"
          change="+8% from last month"
          changeType="positive"
          icon={Building2}
          iconColor="text-warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="metric-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Revenue Trends</h3>
            <p className="text-sm text-muted-foreground">Sales vs Rental Revenue (₹ Lakhs)</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                name="Sales Revenue"
              />
              <Line
                type="monotone"
                dataKey="rentals"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                name="Rental Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* City Performance */}
        <div className="metric-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Revenue by City</h3>
            <p className="text-sm text-muted-foreground">Top performing markets</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cityRevenue}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {cityRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value as number), "Revenue"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Conversion Funnel */}
        <div className="metric-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Lead Conversion Funnel</h3>
            <p className="text-sm text-muted-foreground">Sales pipeline performance</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Performance */}
        <div className="metric-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Monthly Performance</h3>
            <p className="text-sm text-muted-foreground">Leads vs Conversions</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="hsl(var(--accent))" name="Leads" radius={[2, 2, 0, 0]} />
              <Bar dataKey="conversions" fill="hsl(var(--success))" name="Conversions" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="metric-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Performance Summary</h3>
          <p className="text-sm text-muted-foreground">Key insights and trends</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg bg-success/10">
            <div className="text-3xl font-bold text-success mb-2">₹12.8Cr</div>
            <div className="text-sm text-muted-foreground mb-1">Sales Revenue (YTD)</div>
            <div className="text-xs text-success">+18% vs last year</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-accent/10">
            <div className="text-3xl font-bold text-accent mb-2">₹85L</div>
            <div className="text-sm text-muted-foreground mb-1">Rental Revenue (YTD)</div>
            <div className="text-xs text-accent">+12% vs last year</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <div className="text-3xl font-bold text-primary mb-2">18.9%</div>
            <div className="text-sm text-muted-foreground mb-1">Overall Conversion Rate</div>
            <div className="text-xs text-primary">+2.3% vs last month</div>
          </div>
        </div>
      </div>
    </div>
  );
}