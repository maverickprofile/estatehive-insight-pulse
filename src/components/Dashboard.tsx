import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Users, TrendingUp, IndianRupee, MapPin, Plus, UserPlus, BarChart3, PlusCircle, Loader2 } from "lucide-react";
import MetricCard from "./MetricCard";
import PropertyCard from "./PropertyCard";
import SalesChart from "./SalesChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import property1 from "@/assets/property1.jpg"; // Fallback image

const topCities = [
  { name: "Mumbai", revenue: "₹45.2L", growth: "+12%", color: "bg-primary" },
  { name: "Delhi", revenue: "₹38.9L", growth: "+8%", color: "bg-accent" },
  { name: "Bangalore", revenue: "₹32.1L", growth: "+15%", color: "bg-success" },
  { name: "Pune", revenue: "₹28.7L", growth: "+5%", color: "bg-warning" },
  { name: "Hyderabad", revenue: "₹24.3L", growth: "+18%", color: "bg-secondary" },
];

// Function to fetch the 3 most recent properties from Supabase
const fetchRecentProperties = async () => {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
    
    if (error) {
        console.error("Error fetching recent properties:", error);
        throw new Error(error.message);
    }
    return data;
};


export default function Dashboard() {
  const navigate = useNavigate();

  const { data: recentProperties = [], isLoading: isLoadingProperties } = useQuery({
      queryKey: ['recentProperties'],
      queryFn: fetchRecentProperties,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your property overview.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            onClick={() => navigate('/properties/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
          <Button variant="outline" onClick={() => navigate('/leads')}>
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
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/properties/new')}>
              <PlusCircle className="w-4 h-4 mr-3 text-primary" />
              Add New Property
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/leads')}>
              <UserPlus className="w-4 h-4 mr-3 text-accent" />
              Create Lead
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/analytics')}>
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
        <div className="bg-white rounded-xl shadow p-6">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-800">Recently Added Properties</h3>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/properties")}
      className="text-sm"
    >
      View All
    </Button>
  </div>

  {/* Carousel Section */}
  {isLoadingProperties ? (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  ) : (
    <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2">
      {recentProperties.map((property) => (
        <div
          key={property.id}
          className="min-w-[250px] bg-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 flex-shrink-0 flex flex-col justify-between"
        >
          {/* Image */}
          <div className="relative h-36 w-full overflow-hidden rounded-t-2xl">
            <img
              src={property.image_urls?.[0] || property1}
              alt={property.title}
              className="object-cover w-full h-full"
            />
            <button className="absolute top-2 right-2 bg-white/70 rounded-full p-1">
              ❤️
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-1 flex-grow">
            <h4 className="text-base font-medium truncate text-gray-900">
              {property.title}
            </h4>
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {property.location}
            </p>

            {/* Icons */}
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                🛏 {property.bedrooms}
              </div>
              <div className="flex items-center gap-1">
                🛁 {property.bathrooms}
              </div>
              <div className="flex items-center gap-1">
                🚗 {property.parking || 1}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-gray-500 text-xs">Price</span>
              <span className="text-lg font-semibold text-emerald-600 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" />
                {property.price?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* View Button */}
          <div className="p-4 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              View Property
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}

  {/* View All Properties Button */}
  <div className="mt-6 text-center">
    <Button
      onClick={() => navigate("/properties")}
      className="px-6 text-sm font-medium"
    >
      Explore All Properties →
    </Button>
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
    </div>
  );
}
