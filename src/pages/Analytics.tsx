import { useState, useEffect } from "react";
import "./analytics-charts.css";
import "./analytics-mobile.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap,
  Funnel,
  FunnelChart,
  LabelList
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
  Filter,
  Activity,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  MapPin,
  BarChart3,
  PieChartIcon,
  TrendingDown,
  Home,
  Clock,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const monthlyData = [
  { month: "Jan", sales: 24000000, rentals: 1200000, leads: 45, conversions: 12, avgDealSize: 2000000, profit: 4800000 },
  { month: "Feb", sales: 18000000, rentals: 1400000, leads: 52, conversions: 15, avgDealSize: 1200000, profit: 3900000 },
  { month: "Mar", sales: 32000000, rentals: 1100000, leads: 68, conversions: 22, avgDealSize: 1450000, profit: 6640000 },
  { month: "Apr", sales: 28000000, rentals: 1600000, leads: 71, conversions: 18, avgDealSize: 1550000, profit: 5920000 },
  { month: "May", sales: 38000000, rentals: 1800000, leads: 89, conversions: 28, avgDealSize: 1350000, profit: 7960000 },
  { month: "Jun", sales: 34000000, rentals: 1500000, leads: 94, conversions: 31, avgDealSize: 1100000, profit: 7100000 },
];

const cityRevenue = [
  { name: "Mumbai", value: 45200000, growth: 22, properties: 120, color: "#3b82f6" },
  { name: "Delhi", value: 38900000, growth: 18, properties: 95, color: "#10b981" },
  { name: "Bangalore", value: 32100000, growth: 25, properties: 88, color: "#f59e0b" },
  { name: "Pune", value: 28700000, growth: 15, properties: 72, color: "#8b5cf6" },
  { name: "Hyderabad", value: 24300000, growth: 30, properties: 65, color: "#ec4899" },
];

const conversionData = [
  { stage: "Leads", count: 450, percentage: 100, fill: "#3b82f6" },
  { stage: "Qualified", count: 380, percentage: 84, fill: "#10b981" },
  { stage: "Site Visit", count: 220, percentage: 49, fill: "#f59e0b" },
  { stage: "Negotiation", count: 120, percentage: 27, fill: "#8b5cf6" },
  { stage: "Closed", count: 85, percentage: 19, fill: "#ec4899" },
];

const performanceRadar = [
  { metric: "Lead Quality", current: 85, previous: 78, fullMark: 100 },
  { metric: "Response Time", current: 92, previous: 65, fullMark: 100 },
  { metric: "Conversion", current: 78, previous: 82, fullMark: 100 },
  { metric: "Satisfaction", current: 88, previous: 75, fullMark: 100 },
  { metric: "Deal Size", current: 72, previous: 88, fullMark: 100 },
  { metric: "Market Share", current: 80, previous: 70, fullMark: 100 },
];

const dealAnalysisData = [
  { days: 30, dealSize: 2500000, leadScore: 95, name: "Premium Villa", status: "closed" },
  { days: 45, dealSize: 1800000, leadScore: 88, name: "Luxury Apt", status: "closed" },
  { days: 60, dealSize: 3200000, leadScore: 92, name: "Penthouse", status: "negotiation" },
  { days: 75, dealSize: 2100000, leadScore: 85, name: "Office Space", status: "closed" },
  { days: 90, dealSize: 4500000, leadScore: 98, name: "Commercial", status: "negotiation" },
  { days: 105, dealSize: 1600000, leadScore: 78, name: "Studio Apt", status: "closed" },
  { days: 120, dealSize: 2800000, leadScore: 90, name: "Duplex", status: "visit" },
  { days: 135, dealSize: 3500000, leadScore: 94, name: "Row House", status: "closed" },
  { days: 150, dealSize: 2300000, leadScore: 82, name: "Shop", status: "negotiation" },
  { days: 165, dealSize: 3800000, leadScore: 91, name: "Warehouse", status: "visit" },
];

const propertyTypeData = [
  { name: "Residential", value: 65, color: "#3b82f6" },
  { name: "Commercial", value: 20, color: "#10b981" },
  { name: "Industrial", value: 10, color: "#f59e0b" },
  { name: "Land", value: 5, color: "#8b5cf6" },
];

// Enhanced color schemes for better visibility
const chartColors = {
  primary: "#3b82f6",
  secondary: "#10b981",
  tertiary: "#f59e0b",
  quaternary: "#8b5cf6",
  quinary: "#ec4899",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444"
};

// Y-axis formatter for charts
const formatYAxis = (value: number) => {
  return formatIndianCurrency(value, { compact: true, showDecimal: false });
};

// Check if mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background dark:bg-gray-900 border-2 border-border dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-2xl analytics-tooltip max-w-[250px] sm:max-w-none">
        <p className="font-bold text-sm sm:text-lg mb-2 text-foreground dark:text-white analytics-tooltip-title">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1 analytics-tooltip-item">
            <div 
              className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" 
              style={{ backgroundColor: entry.stroke || entry.fill || entry.color }} 
            />
            <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 font-medium">{entry.name}:</span>
            <span className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
              {entry.name.toLowerCase().includes("revenue") || 
               entry.name.toLowerCase().includes("sales") || 
               entry.name.toLowerCase().includes("rentals") ||
               entry.name.toLowerCase().includes("size") ||
               entry.name.toLowerCase().includes("profit")
                ? formatIndianCurrency(entry.value, { showDecimal: false }) 
                : typeof entry.value === 'number' 
                  ? entry.value.toLocaleString()
                  : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AnimatedMetricCard = ({ title, value, change, changeType, icon: Icon, trend, subtitle, color }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden relative border-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "absolute inset-0 opacity-10 transition-opacity duration-500",
          isHovered && "opacity-20"
        )}
        style={{ 
          background: `linear-gradient(135deg, ${color || chartColors.primary} 0%, transparent 100%)` 
        }}
      />
      <CardContent className="p-4 sm:p-6 relative analytics-content">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div 
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{ backgroundColor: `${color || chartColors.primary}20` }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 metric-card-icon" style={{ color: color || chartColors.primary }} />
          </div>
          <div className={cn(
            "flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold metric-card-change",
            changeType === "positive" 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {changeType === "positive" ? (
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            {change}
          </div>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 font-semibold uppercase tracking-wider metric-card-title">{title}</p>
          <p className="text-2xl sm:text-4xl font-bold mt-1 sm:mt-2 text-foreground dark:text-white metric-card-value">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-500 mt-1 sm:mt-2 metric-card-subtitle">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 sm:mt-4">
              <Progress value={trend} className="h-1.5 sm:h-2" style={{ 
                "--progress-background": `${color || chartColors.primary}20`,
                "--progress-foreground": color || chartColors.primary 
              } as any} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ModernAreaChart = ({ data }: any) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="chart-scroll-container">
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 400} className="analytics-chart-container">
        <AreaChart data={data} margin={{ top: 10, right: isMobile ? 10 : 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="rentalsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.tertiary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={chartColors.tertiary} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            stroke="var(--muted-foreground)"
            style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 500 }}
          />
          <YAxis 
            stroke="var(--muted-foreground)"
            tickFormatter={formatYAxis}
            style={{ fontSize: isMobile ? '10px' : '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "20px", fontSize: isMobile ? '12px' : '14px' }}
            iconType="circle"
            formatter={(value) => <span className="text-foreground dark:text-white font-medium">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke={chartColors.primary}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#salesGradient)"
            name="Sales"
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="rentals"
            stroke={chartColors.secondary}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#rentalsGradient)"
            name="Rentals"
            animationDuration={1500}
          />
          {!isMobile && (
            <Area
              type="monotone"
              dataKey="profit"
              stroke={chartColors.tertiary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#profitGradient)"
              name="Profit"
              strokeDasharray="5 5"
              animationDuration={1500}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const ModernRadarChart = ({ data }: any) => {
  const isMobile = useIsMobile();
  
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400} className="analytics-chart-container">
      <RadarChart data={data}>
        <PolarGrid 
          stroke="var(--border)" 
          strokeWidth={1}
          radialLines={true}
        />
        <PolarAngleAxis 
          dataKey="metric" 
          stroke="var(--foreground)"
          className="dark:text-white"
          style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 500 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          stroke="var(--muted-foreground)"
          style={{ fontSize: isMobile ? '10px' : '11px' }}
        />
        <Radar 
          name="Current" 
          dataKey="current" 
          stroke={chartColors.primary}
          fill={chartColors.primary}
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Radar 
          name="Previous" 
          dataKey="previous" 
          stroke={chartColors.secondary}
          fill={chartColors.secondary}
          fillOpacity={0.3}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <Legend 
          wrapperStyle={{ paddingTop: "20px", fontSize: isMobile ? '12px' : '14px' }}
          formatter={(value) => <span className="text-foreground dark:text-white font-medium">{value}</span>}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const ModernScatterChart = ({ data }: any) => {
  const isMobile = useIsMobile();
  
  const getColorByStatus = (status: string) => {
    switch(status) {
      case 'closed': return chartColors.success;
      case 'negotiation': return chartColors.warning;
      case 'visit': return chartColors.primary;
      default: return chartColors.quaternary;
    }
  };

  return (
    <div className="chart-scroll-container">
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 400} className="analytics-chart-container">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: isMobile ? 20 : 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis 
            type="number" 
            dataKey="days" 
            name="Days to Close"
            unit=" days"
            stroke="var(--muted-foreground)"
            style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 500 }}
            label={!isMobile ? { value: "Days to Close", position: "insideBottom", offset: -10, style: { fill: 'var(--foreground)' } } : undefined}
          />
          <YAxis 
            type="number" 
            dataKey="dealSize" 
            name="Deal Size"
            stroke="var(--muted-foreground)"
            tickFormatter={formatYAxis}
            style={{ fontSize: isMobile ? '10px' : '12px' }}
            label={!isMobile ? { value: "Deal Size (₹)", angle: -90, position: "insideLeft", style: { fill: 'var(--foreground)' } } : undefined}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background dark:bg-gray-900 border-2 border-border dark:border-gray-700 rounded-lg p-3 shadow-2xl max-w-[200px]">
                    <p className="font-bold text-sm mb-2 text-foreground dark:text-white">{data.name}</p>
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="text-muted-foreground dark:text-gray-400">Size:</span>{' '}
                        <span className="font-bold text-foreground dark:text-white">{formatIndianCurrency(data.dealSize)}</span>
                      </p>
                      <p className="text-xs">
                        <span className="text-muted-foreground dark:text-gray-400">Days:</span>{' '}
                        <span className="font-bold text-foreground dark:text-white">{data.days}</span>
                      </p>
                      <p className="text-xs">
                        <span className="text-muted-foreground dark:text-gray-400">Score:</span>{' '}
                        <span className="font-bold text-foreground dark:text-white">{data.leadScore}/100</span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            name="Deals" 
            data={data}
            fill={chartColors.primary}
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              const size = isMobile ? (payload.leadScore / 100) * 10 + 3 : (payload.leadScore / 100) * 15 + 5;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={size}
                  fill={getColorByStatus(payload.status)}
                  fillOpacity={0.7}
                  stroke={getColorByStatus(payload.status)}
                  strokeWidth={2}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

const ModernFunnelChart = ({ data }: any) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {data.map((item: any, index: number) => {
        const isLast = index === data.length - 1;
        return (
          <div key={item.stage} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-lg font-bold text-foreground dark:text-white funnel-stage-text">{item.stage}</span>
                <span className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 funnel-count-text">({item.count})</span>
              </div>
              <span className="text-sm sm:text-lg font-bold funnel-percentage" style={{ color: item.fill }}>
                {item.percentage}%
              </span>
            </div>
            <div className="relative">
              <div className="h-10 sm:h-12 bg-muted/30 dark:bg-gray-800/30 rounded-lg overflow-hidden funnel-bar">
                <div 
                  className="h-full rounded-lg transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ 
                    width: `${item.percentage}%`,
                    background: `linear-gradient(90deg, ${item.fill} 0%, ${item.fill}dd 100%)`
                  }}
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </div>
              </div>
              {!isLast && (
                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2">
                  <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground dark:text-gray-600" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("last30days");
  const [selectedCity, setSelectedCity] = useState("all");
  const [viewMode, setViewMode] = useState("overview");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleExport = (type: string) => {
    toast({
      title: "Export Started",
      description: `Generating ${type.toUpperCase()} report.`
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground dark:text-white analytics-main-title">
            Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground dark:text-gray-400 mt-1 sm:mt-2 analytics-subtitle">
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2 analytics-action-buttons">
          <Button 
            variant={viewMode === "overview" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("overview")}
            className="gap-1 sm:gap-2 analytics-action-button text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">View</span>
          </Button>
          <Button 
            variant={viewMode === "detailed" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("detailed")}
            className="gap-1 sm:gap-2 analytics-action-button text-xs sm:text-sm"
          >
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Detailed</span>
            <span className="sm:hidden">Detail</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('pdf')} 
            className="gap-1 sm:gap-2 analytics-action-button text-xs sm:text-sm"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('excel')} 
            className="gap-1 sm:gap-2 analytics-action-button text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="border-2">
        <CardContent className="pt-4 sm:pt-6 analytics-content">
          <div className="flex flex-col lg:flex-row gap-3 analytics-filters">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full lg:w-[200px] analytics-filter-select">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-primary" />
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
              <SelectTrigger className="w-full lg:w-[200px] analytics-filter-select">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-primary" />
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
            <Button className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white analytics-filter-button">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Animated Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnimatedMetricCard
          title="Total Revenue"
          value="₹18.5 Cr"
          change="22%"
          changeType="positive"
          icon={IndianRupee}
          trend={75}
          subtitle="YTD Performance"
          color={chartColors.primary}
        />
        <AnimatedMetricCard
          title="Conversion Rate"
          value="18.9%"
          change="2.3%"
          changeType="positive"
          icon={Target}
          trend={65}
          subtitle="vs Industry: 15.2%"
          color={chartColors.secondary}
        />
        <AnimatedMetricCard
          title="Active Leads"
          value="450"
          change="15%"
          changeType="positive"
          icon={Users}
          trend={82}
          subtitle="68 Hot Leads"
          color={chartColors.tertiary}
        />
        <AnimatedMetricCard
          title="Properties Sold"
          value="85"
          change="8%"
          changeType="positive"
          icon={Building2}
          trend={58}
          subtitle="₹2.18L Avg"
          color={chartColors.quaternary}
        />
      </div>

      {/* Main Charts Section with Tabs */}
      <Card className="border-2 analytics-card">
        <CardHeader className="analytics-header">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl analytics-section-title text-foreground dark:text-white">
            Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="analytics-content">
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 analytics-tabs-list">
              <TabsTrigger value="revenue" className="gap-1 sm:gap-2 text-xs sm:text-sm analytics-tabs-trigger">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Revenue</span>
                <span className="sm:hidden">Rev</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-1 sm:gap-2 text-xs sm:text-sm analytics-tabs-trigger">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Performance</span>
                <span className="sm:hidden">Perf</span>
              </TabsTrigger>
              <TabsTrigger value="deals" className="gap-1 sm:gap-2 text-xs sm:text-sm analytics-tabs-trigger">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Deals</span>
                <span className="sm:hidden">Deal</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="revenue" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 analytics-section-subtitle">
                  Monthly revenue breakdown
                </p>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-400">Live</span>
                </div>
              </div>
              <ModernAreaChart data={monthlyData} />
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 analytics-section-subtitle">
                  Quarterly comparison
                </p>
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              </div>
              <ModernRadarChart data={performanceRadar} />
            </TabsContent>
            
            <TabsContent value="deals" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 analytics-section-subtitle">
                  Deal analysis
                </p>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <ModernScatterChart data={dealAnalysisData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Modern Donut Chart */}
        <Card className="border-2 analytics-card">
          <CardHeader className="analytics-header">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg lg:text-xl analytics-section-title text-foreground dark:text-white">
                  City Performance
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 mt-1 analytics-section-subtitle">
                  Revenue by market
                </p>
              </div>
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="analytics-content">
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 350} className="analytics-chart-container small">
              <PieChart>
                <Pie
                  data={cityRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 80}
                  outerRadius={isMobile ? 90 : 140}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {cityRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  {!isMobile && (
                    <LabelList 
                      dataKey="name" 
                      position="outside"
                      style={{ fill: 'var(--foreground)', fontSize: '14px', fontWeight: 600 }}
                      className="dark:fill-white"
                    />
                  )}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 city-revenue-grid">
              {cityRevenue.map((city) => (
                <div key={city.name} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 dark:bg-gray-800/30 city-revenue-item">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: city.color }} />
                    <span className="text-xs sm:text-sm font-medium text-foreground dark:text-white">{city.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-foreground dark:text-white">{city.properties}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-500">props</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="border-2 analytics-card">
          <CardHeader className="analytics-header">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg lg:text-xl analytics-section-title text-foreground dark:text-white">
                  Conversion Funnel
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 mt-1 analytics-section-subtitle">
                  Lead journey
                </p>
              </div>
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="analytics-content">
            <ModernFunnelChart data={conversionData} />
          </CardContent>
        </Card>
      </div>

      {/* Property Type Distribution */}
      <Card className="border-2 analytics-card">
        <CardHeader className="analytics-header">
          <CardTitle className="text-base sm:text-lg lg:text-xl analytics-section-title text-foreground dark:text-white">
            Property Type Distribution
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 analytics-section-subtitle">
            Market share by category
          </p>
        </CardHeader>
        <CardContent className="analytics-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 property-type-grid">
            {propertyTypeData.map((type) => (
              <div key={type.name} className="relative group">
                <div 
                  className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 property-type-card"
                  style={{ borderColor: `${type.color}40`, backgroundColor: `${type.color}10` }}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Home className="h-6 w-6 sm:h-8 sm:w-8 property-type-icon" style={{ color: type.color }} />
                    <span 
                      className="text-2xl sm:text-3xl font-bold property-type-value"
                      style={{ color: type.color }}
                    >
                      {type.value}%
                    </span>
                  </div>
                  <p className="text-sm sm:text-lg font-semibold text-foreground dark:text-white">{type.name}</p>
                  <div className="mt-3 sm:mt-4">
                    <Progress 
                      value={type.value} 
                      className="h-1.5 sm:h-2"
                      style={{ 
                        "--progress-background": `${type.color}20`,
                        "--progress-foreground": type.color 
                      } as any}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 analytics-card">
        <CardHeader className="analytics-header">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg lg:text-xl analytics-section-title text-foreground dark:text-white">
                Executive Summary
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 analytics-section-subtitle">
                Year-to-date highlights
              </p>
            </div>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="analytics-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 summary-card-grid">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-white summary-label">Revenue</span>
                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">82%</span>
              </div>
              <Progress value={82} className="h-2 sm:h-3 bg-blue-100 dark:bg-blue-950/30" />
              <p className="text-xl sm:text-2xl font-bold text-foreground dark:text-white summary-value">₹15.2 Cr</p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">+₹2.8 Cr</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-white summary-label">Leads</span>
                <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">94%</span>
              </div>
              <Progress value={94} className="h-2 sm:h-3 bg-green-100 dark:bg-green-950/30" />
              <p className="text-xl sm:text-2xl font-bold text-foreground dark:text-white summary-value">1,880</p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">+120</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-white summary-label">Conversion</span>
                <span className="text-xs sm:text-sm font-bold text-yellow-600 dark:text-yellow-400">112%</span>
              </div>
              <Progress value={100} className="h-2 sm:h-3 bg-yellow-100 dark:bg-yellow-950/30" />
              <p className="text-xl sm:text-2xl font-bold text-foreground dark:text-white summary-value">22.4%</p>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">+2.4%</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-white summary-label">Satisfaction</span>
                <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">88%</span>
              </div>
              <Progress value={88} className="h-2 sm:h-3 bg-purple-100 dark:bg-purple-950/30" />
              <p className="text-xl sm:text-2xl font-bold text-foreground dark:text-white summary-value">4.4/5</p>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 font-medium">↑ 0.3</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}