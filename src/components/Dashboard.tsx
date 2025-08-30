import React, { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Users,
  TrendingUp,
  IndianRupee,
  PlusSquare,
  UserPlus,
  Crown,
  MessageSquare,
  CalendarCheck,
  FileText,
  Send,
  PlusCircle,
  Bell,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
// Lazy load SalesChart component
const SalesChart = lazy(() => import("./SalesChart"));

type Property = {
  id: string;
  image_url?: string;
  image_urls?: string[];
  images?: string[];
  title?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  price?: number;
  status?: "active" | "sold" | "rented" | null;
  listing_type?: "sale" | "rent" | null;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
};

type Agent = {
  name: string;
  avatar_url?: string;
  total_revenue: number;
};

type Notification = {
  id: string;
  title: string;
  description: string;
};

const fetchRecentProperties = async () => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return data;
};

const fetchDashboardMetrics = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: totalProperties },
    { count: activeListings },
    { count: leadsToday },
    { data: salesThisMonth },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("sales")
      .select("sale_price")
      .gte("sale_date", monthStart.toISOString()),
  ]);

  const revenueThisMonth =
    salesThisMonth?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
  return { totalProperties, activeListings, leadsToday, revenueThisMonth };
};

const fetchTopAgents = async () => {
  const { data, error } = await supabase.rpc("get_top_agents");
  if (error) throw new Error(error.message);
  return data;
};

const fetchProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", session.user.id)
    .single();

  if (error) throw error;
  return { id: session.user.id, ...data };
};

const fetchNotifications = async (userId: string) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data;
};

// Revenue formatting function
const formatRevenue = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString()}`;
};

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

// Memoized KpiCard component to prevent unnecessary re-renders
const KpiCard = React.memo(function KpiCard({ title, value, icon: Icon }: KpiCardProps) {
  return (
    <div className="metric-card p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold truncate">{value}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </div>
  );
});

const CARD_CLASS = "metric-card";

// Lazy image component with loading states
const LazyImage = React.memo(function LazyImage({ 
  src, 
  alt, 
  className, 
  onLoad 
}: { 
  src: string; 
  alt: string; 
  className: string; 
  onLoad?: () => void; 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <Building2 className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-muted animate-pulse`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </>
  );
});

// Agent item component for better performance
const AgentItem = React.memo(function AgentItem({ 
  agent, 
  index, 
  maxRevenue 
}: { 
  agent: Agent; 
  index: number; 
  maxRevenue: number; 
}) {
  const progressValue = useMemo(() => 
    maxRevenue ? (agent.total_revenue / maxRevenue) * 100 : 0,
    [agent.total_revenue, maxRevenue]
  );

  const formattedRevenue = useMemo(() => 
    formatRevenue(agent.total_revenue),
    [agent.total_revenue]
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
        <AvatarImage src={agent.avatar_url} alt={agent.name} />
        <AvatarFallback className="text-xs sm:text-sm">{agent.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-semibold flex items-center gap-1 truncate">
          {agent.name}
          {index === 0 && <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Revenue: {formattedRevenue}
        </p>
        <Progress
          value={progressValue}
          className="h-1.5 sm:h-2 mt-1 sm:mt-2"
        />
      </div>
      <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
});

// Property slide component for better performance
const PropertySlide = React.memo(function PropertySlide({ 
  property, 
  onNavigate 
}: { 
  property: Property; 
  onNavigate: (id: string) => void; 
}) {
  // Memoize image URL calculation
  const imageUrl = useMemo(() => {
    return property.image_url || 
           (property.image_urls && property.image_urls[0]) || 
           (property.images && property.images[0]) || 
           `https://via.placeholder.com/800x400?text=${encodeURIComponent(property.title || 'Property')}`;
  }, [property.image_url, property.image_urls, property.images, property.title]);

  // Memoize location string
  const locationString = useMemo(() => {
    const locationParts = [];
    if (property.neighborhood) locationParts.push(property.neighborhood);
    if (property.city) locationParts.push(property.city);
    if (property.state) locationParts.push(property.state);
    return locationParts.length > 0 
      ? locationParts.join(", ")
      : property.location || property.address || "Location not specified";
  }, [property.neighborhood, property.city, property.state, property.location, property.address]);

  // Memoize formatted price
  const formattedPrice = useMemo(() => 
    formatRevenue(property.price || 0),
    [property.price]
  );

  const handleClick = useCallback(() => {
    onNavigate(property.id);
  }, [property.id, onNavigate]);

  return (
    <div className="w-full flex-shrink-0">
      <div className="relative group cursor-pointer" onClick={handleClick}>
        <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
          <LazyImage
            src={imageUrl}
            alt={property.title || "Property"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2">
                  {property.title || "Untitled Property"}
                </h4>
                <p className="text-sm text-white/90 mb-3 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {locationString}
                </p>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  {property.bedrooms && (
                    <span>{property.bedrooms} Beds</span>
                  )}
                  {property.bathrooms && (
                    <span>{property.bathrooms} Baths</span>
                  )}
                  {property.area_sqft && (
                    <span>{property.area_sqft.toLocaleString()} sqft</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formattedPrice}
                </p>
                <div className="flex gap-2 mt-2 justify-end">
                  {property.status && (
                    <Badge className={cn(
                      "capitalize",
                      property.status === "active" && "bg-green-500/20 text-green-300 border-green-500/30",
                      property.status === "sold" && "bg-red-500/20 text-red-300 border-red-500/30",
                      property.status === "rented" && "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    )}>
                      {property.status}
                    </Badge>
                  )}
                  {property.listing_type && (
                    <Badge className="bg-white/20 text-white border-white/30 capitalize">
                      For {property.listing_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function Dashboard() {
  const navigate = useNavigate();
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
  });

  const { data: recentProperties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ["recent-properties"],
    queryFn: fetchRecentProperties,
  });

  const { data: topAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["top-agents"],
    queryFn: fetchTopAgents,
  });

  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["dashboard-notifications", profile?.id],
    queryFn: () => fetchNotifications(profile!.id),
    enabled: !!profile?.id,
  });

  // Memoized calculations for performance
  const maxAgentRevenue = useMemo(() => 
    topAgents?.[0]?.total_revenue || 0, 
    [topAgents]
  );

  // Memoized navigation handlers
  const handlePropertyNavigation = useCallback((id: string) => {
    navigate(`/properties/${id}`);
  }, [navigate]);

  const handlePreviousProperty = useCallback(() => {
    setCurrentPropertyIndex((prev) => 
      prev === 0 ? recentProperties.length - 1 : prev - 1
    );
  }, [recentProperties.length]);

  const handleNextProperty = useCallback(() => {
    setCurrentPropertyIndex((prev) => 
      (prev + 1) % recentProperties.length
    );
  }, [recentProperties.length]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentPropertyIndex(index);
  }, []);

  // Memoized KPI values
  const kpiValues = useMemo(() => ({
    totalProperties: metrics ? `${metrics.totalProperties}` : "...",
    leadsToday: metrics ? `${metrics.leadsToday}` : "...",
    revenue: metrics ? formatRevenue(metrics.revenueThisMonth) : "...",
    activeListings: metrics ? `${metrics.activeListings}` : "..."
  }), [metrics]);

  // Memoized rendered properties for slideshow
  const renderedProperties = useMemo(() => 
    recentProperties.map((property: Property) => (
      <PropertySlide
        key={property.id}
        property={property}
        onNavigate={handlePropertyNavigation}
      />
    )),
    [recentProperties, handlePropertyNavigation]
  );

  // Memoized rendered agents
  const renderedAgents = useMemo(() => 
    topAgents.slice(0, 5).map((agent: Agent, index: number) => (
      <AgentItem
        key={agent.name}
        agent={agent}
        index={index}
        maxRevenue={maxAgentRevenue}
      />
    )),
    [topAgents, maxAgentRevenue]
  );

  // Memoized loading skeletons
  const agentSkeletons = useMemo(() => 
    Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />
    )),
    []
  );

  const notificationSkeletons = useMemo(() => 
    Array.from({ length: 2 }, (_, i) => (
      <Skeleton key={i} className="h-12 sm:h-16 rounded-lg" />
    )),
    []
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Estate Hive Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Agent"}! Here's your real-time overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate("/properties/new")} className="flex items-center justify-center gap-2 text-sm">
            <PlusSquare className="h-4 w-4" /> 
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Property</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/leads/new")}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus className="h-4 w-4" /> 
            <span className="hidden sm:inline">Add Lead</span>
            <span className="sm:hidden">Lead</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Properties"
          value={kpiValues.totalProperties}
          icon={Building2}
        />
        <KpiCard
          title="Leads Today"
          value={kpiValues.leadsToday}
          icon={Users}
        />
        <KpiCard
          title="Revenue"
          value={kpiValues.revenue}
          icon={IndianRupee}
        />
        <KpiCard
          title="Active"
          value={kpiValues.activeListings}
          icon={TrendingUp}
        />
      </div>

      {/* Chart and Agents */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Monthly Performance</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/analytics")}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">View Full Reports</span>
                <span className="sm:hidden">View All</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Suspense fallback={
                <div className="h-96 flex items-center justify-center">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              }>
                <SalesChart />
              </Suspense>
            </div>
            <div className="mt-4 grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 text-xs sm:text-sm text-muted-foreground">
              <p>Highest Revenue Month: --</p>
              <p>Average Leads per Month: --</p>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Recent Properties</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Latest listings in your portfolio
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/properties")}
                className="text-xs sm:text-sm"
              >
                View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
            
            {loadingProperties ? (
              <div className="flex items-center justify-center h-64">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ) : recentProperties.length > 0 ? (
              <div className="relative">
                {/* Navigation Buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/90 rounded-full"
                  onClick={handlePreviousProperty}
                  disabled={recentProperties.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/90 rounded-full"
                  onClick={handleNextProperty}
                  disabled={recentProperties.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Property Slideshow */}
                <div className="overflow-hidden rounded-lg">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentPropertyIndex * 100}%)` }}
                  >
                    {renderedProperties}
                  </div>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-2 mt-4">
                  {recentProperties.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        currentPropertyIndex === index
                          ? "bg-primary w-8"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                      aria-label={`Go to property ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No properties available</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate("/properties/new")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Property
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Top Agents</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/agents")}
                className="text-xs sm:text-sm"
              >
                View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
              {loadingAgents ? agentSkeletons : renderedAgents}
            </div>
          </div>

          <div className={CARD_CLASS}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Schedule</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Add Task</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Report</span>
              </Button>
            </div>

            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Notifications</h3>
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
              {loadingNotifications
                ? notificationSkeletons
                : notifications.length > 0
                ? notifications.slice(0, 5).map((n: Notification) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50"
                    >
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 sm:mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{n.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  ))
                : (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                      No new notifications
                    </p>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export memoized Dashboard component
export default React.memo(Dashboard);
