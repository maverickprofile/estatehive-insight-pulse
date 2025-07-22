import { Building2, Users, TrendingUp, IndianRupee, MapPin, Plus, UserPlus, BarChart3 } from "lucide-react";
import MetricCard from "./MetricCard";
import PropertyCard from "./PropertyCard";
import SalesChart from "./SalesChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import property images
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";

const topCities = [
  { name: "Mumbai", revenue: "₹45.2L", growth: "+12%", color: "bg-primary" },
  { name: "Delhi", revenue: "₹38.9L", growth: "+8%", color: "bg-accent" },
  { name: "Bangalore", revenue: "₹32.1L", growth: "+15%", color: "bg-success" },
  { name: "Pune", revenue: "₹28.7L", growth: "+5%", color: "bg-warning" },
  { name: "Hyderabad", revenue: "₹24.3L", growth: "+18%", color: "bg-secondary" },
];

const recentProperties = [
  {
    image: property1,
    title: "Luxury Apartment in Bandra",
    location: "Bandra West, Mumbai",
    price: "₹2.8 Cr",
    status: "active" as const,
    type: "sale" as const,
  },
  {
    image: property2,
    title: "Modern Villa with Garden",
    location: "Koramangala, Bangalore",
    price: "₹95,000/month",
    status: "rented" as const,
    type: "rent" as const,
  },
  {
    image: property3,
    title: "Commercial Office Space",
    location: "Connaught Place, Delhi",
    price: "₹1.5 Cr",
    status: "sold" as const,
    type: "sale" as const,
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Rahul! Here's your property overview.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
          <Button variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Properties"
          value="1,248"
          change="+12% from last month"
          changeType="positive"
          icon={Building2}
          iconColor="text-primary"
        />
        <MetricCard
          title="Leads Today"
          value="47"
          change="+8% from yesterday"
          changeType="positive"
          icon={Users}
          iconColor="text-accent"
        />
        <MetricCard
          title="Revenue This Month"
          value="₹1.85 Cr"
          change="+15% from last month"
          changeType="positive"
          icon={IndianRupee}
          iconColor="text-success"
        />
        <MetricCard
          title="Active Listings"
          value="892"
          change="-2% from last month"
          changeType="negative"
          icon={TrendingUp}
          iconColor="text-warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        {/* Quick Actions */}
        <div className="metric-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-3 text-primary" />
              Add New Property
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <UserPlus className="w-4 h-4 mr-3 text-accent" />
              Create Lead
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-3 text-success" />
              View Analytics
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <MapPin className="w-4 h-4 mr-3 text-warning" />
              Manage Locations
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Properties */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recently Added Properties</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {recentProperties.map((property, index) => (
              <PropertyCard key={index} {...property} />
            ))}
          </div>
        </div>

        {/* Top Performing Cities */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Performing Cities</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-4">
            {topCities.map((city, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${city.color}`} />
                  <div>
                    <p className="font-medium text-foreground">{city.name}</p>
                    <p className="text-sm text-muted-foreground">Revenue: {city.revenue}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-success">
                  {city.growth}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="metric-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Listing Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success mb-1">634</div>
            <div className="text-sm text-muted-foreground">Active Listings</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-accent/10">
            <div className="text-2xl font-bold text-accent mb-1">892</div>
            <div className="text-sm text-muted-foreground">Sold Properties</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive mb-1">156</div>
            <div className="text-sm text-muted-foreground">Expired Listings</div>
          </div>
        </div>
      </div>
    </div>
  );
}