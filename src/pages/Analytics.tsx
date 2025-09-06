import { useState } from "react";
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
import { formatIndianCurrency } from "@/lib/currency-formatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Building2, 
  Target, 
  Download,
  Calendar,
  FileText,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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

// Y-axis formatter for charts
const formatYAxis = (value: number) => {
  return formatIndianCurrency(value, { compact: true, showDecimal: false });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 border border-border backdrop-blur-md rounded-md p-3 shadow-md">
        <p className="font-semibold mb-2 text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.stroke || entry.fill }}>
            {entry.name}: {entry.name.includes("Revenue") || entry.name.includes("revenue") 
              ? formatIndianCurrency(entry.value, { showDecimal: false }) 
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("last30days");
  const [selectedCity, setSelectedCity] = useState("all");
  const { toast } = useToast();

  const handleExport = (type: string) => {
    toast({
      title: "Export Started",
      description: `Generating ${type.toUpperCase()} report. This will be downloaded shortly.`
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Comprehensive insights into your real estate business performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="pune">Pune</SelectItem>
                <SelectItem value="hyderabad">Hyderabad</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trends</CardTitle>
            <p className="text-sm text-muted-foreground">Sales vs Rental Revenue</p>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={formatYAxis}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                label={{ 
                  value: "Revenue (₹)", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { textAnchor: 'middle', fill: 'var(--muted-foreground)', fontSize: 12 }
                }}
              />
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
          </CardContent>
        </Card>

        {/* City Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by City</CardTitle>
            <p className="text-sm text-muted-foreground">Top performing markets</p>
          </CardHeader>
          <CardContent>
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
              <Tooltip formatter={(value) => [formatIndianCurrency(value as number, { showDecimal: false }), "Revenue"]} />
            </PieChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Conversion Funnel</CardTitle>
            <p className="text-sm text-muted-foreground">Sales pipeline performance</p>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis 
                type="number" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="stage" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Performance</CardTitle>
            <p className="text-sm text-muted-foreground">Leads vs Conversions</p>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                label={{ 
                  value: "Count", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { textAnchor: 'middle', fill: 'var(--muted-foreground)', fontSize: 12 }
                }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="hsl(var(--accent))" name="Leads" radius={[2, 2, 0, 0]} />
              <Bar dataKey="conversions" fill="hsl(var(--success))" name="Conversions" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
          <p className="text-sm text-muted-foreground">Key insights and trends</p>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="text-2xl font-bold text-success mb-2 tabular-nums">{formatIndianCurrency(128000000, { compact: true, showDecimal: false })}</div>
            <div className="text-sm text-muted-foreground mb-1">Sales Revenue (YTD)</div>
            <div className="text-xs text-success font-medium">↑ 18% vs last year</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="text-2xl font-bold text-accent mb-2 tabular-nums">{formatIndianCurrency(8500000, { compact: true, showDecimal: false })}</div>
            <div className="text-sm text-muted-foreground mb-1">Rental Revenue (YTD)</div>
            <div className="text-xs text-accent font-medium">↑ 12% vs last year</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-2 tabular-nums">18.9%</div>
            <div className="text-sm text-muted-foreground mb-1">Overall Conversion Rate</div>
            <div className="text-xs text-primary font-medium">↑ 2.3% vs last month</div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}