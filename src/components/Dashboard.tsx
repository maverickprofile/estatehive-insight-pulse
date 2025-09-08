import React, { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { LucideIcon } from "lucide-react";
import { formatIndianCurrency } from "@/lib/currency-formatter";
import { EmptyState } from "@/components/ui/empty-state";
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
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import "./dashboard-stats.css";
import "./property-cards.css";
import "./property-carousel.css";
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

// Use the new currency formatter for consistency
const formatRevenue = (value: number) => formatIndianCurrency(value, { compact: true, showDecimal: false });

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  period?: string;
  cardType?: 'properties' | 'leads' | 'revenue' | 'active';
}

// Modern KpiCard component matching Ads Manager design
const KpiCard = React.memo(function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  change = 0, 
  period = "vs last month",
  cardType = 'properties'
}: KpiCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  const changeColor = isPositive ? 'stats-change-positive' : isNegative ? 'stats-change-negative' : 'stats-change-neutral';
  
  return (
    <div className={cn("stats-card", `stats-card-${cardType}`)}>
      <div className="stats-header">
        <div>
          <p className="stats-label">{title}</p>
          <p className="stats-value">{value}</p>
        </div>
        <div className="stats-icon-wrapper">
          <Icon className="stats-icon" />
        </div>
      </div>
      <div className="stats-footer">
        <div className={cn("stats-change", changeColor)}>
          {React.createElement(changeIcon, { className: "h-4 w-4" })}
          <span>{Math.abs(change)}%</span>
        </div>
        <span className="stats-period">{period}</span>
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

// Modern Property Card Component
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
           null;
  }, [property.image_url, property.image_urls, property.images]);

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
    `₹${(property.price || 0) >= 10000000 
      ? `${((property.price || 0) / 10000000).toFixed(2)} Cr` 
      : `${((property.price || 0) / 100000).toFixed(2)} L`}`,
    [property.price]
  );

  const handleClick = useCallback(() => {
    onNavigate(property.id);
  }, [property.id, onNavigate]);

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="property-card" onClick={handleClick}>
      {/* Image Section */}
      <div className="property-image-container">
        {imageUrl ? (
          <>
            <LazyImage
              src={imageUrl}
              alt={property.title || "Property"}
              className="property-image"
            />
            <div className="property-image-overlay" />
          </>
        ) : (
          <div className="property-no-image">
            <Building2 className="property-no-image-icon" />
            <span className="property-no-image-text">No Image Available</span>
          </div>
        )}
        
        {/* Badges */}
        {property.listing_type && (
          <div className={cn("property-badge", property.listing_type)}>
            For {property.listing_type}
          </div>
        )}
        
        {/* Price Tag */}
        <div className="property-price-tag">
          {formattedPrice}
        </div>
      </div>

      {/* Content Section - Overlaid on image */}
      <div className="property-content">
        {/* Header */}
        <div className="property-header">
          <h3 className="property-title">
            {property.title || "Premium Property"}
          </h3>
          <div className="property-location">
            <MapPin className="property-location-icon" />
            <span>{locationString}</span>
          </div>
        </div>

        {/* Features */}
        <div className="property-features">
          {property.bedrooms && (
            <div className="property-feature">
              <Bed className="property-feature-icon" />
              <span>
                <span className="property-feature-value">{property.bedrooms}</span> Beds
              </span>
            </div>
          )}
          {property.bathrooms && (
            <div className="property-feature">
              <Bath className="property-feature-icon" />
              <span>
                <span className="property-feature-value">{property.bathrooms}</span> Baths
              </span>
            </div>
          )}
          {property.area_sqft && (
            <div className="property-feature">
              <Square className="property-feature-icon" />
              <span>
                <span className="property-feature-value">{property.area_sqft.toLocaleString()}</span> sqft
              </span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="property-action">
          <button className="property-button">
            View Details
            <ArrowRight className="property-button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
});

function Dashboard() {
  const navigate = useNavigate();
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [visibleCards] = useState(3); // Show 3 cards at a time

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
      prev === 0 ? Math.max(0, recentProperties.length - visibleCards) : Math.max(0, prev - 1)
    );
  }, [recentProperties.length, visibleCards]);

  const handleNextProperty = useCallback(() => {
    setCurrentPropertyIndex((prev) => 
      prev >= recentProperties.length - visibleCards ? 0 : prev + 1
    );
  }, [recentProperties.length, visibleCards]);


  // Memoized KPI values with proper ordering and changes
  const kpiValues = useMemo(() => {
    // Calculate percentage changes (mock data for now)
    const revenueChange = 12.5;
    const activeChange = -3.2;
    const leadsChange = 28.4;
    const totalChange = 5.7;
    
    return {
      revenue: metrics ? `₹${(metrics.revenueThisMonth / 1000).toFixed(1)}K` : "₹0K",
      activeProperties: metrics ? `${metrics.activeListings}` : "0",
      leadsToday: metrics ? `${metrics.leadsToday}` : "0",
      totalProperties: metrics ? `${metrics.totalProperties}` : "0",
      revenueChange,
      activeChange,
      leadsChange,
      totalChange
    };
  }, [metrics]);


  // Memoized rendered agents with empty state
  const renderedAgents = useMemo(() => {
    if (!topAgents || topAgents.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="No agents yet"
          description="Start adding agents to see performance metrics"
          action={{
            label: "Add Agent",
            onClick: () => navigate("/agents/new"),
          }}
          size="sm"
        />
      );
    }
    return topAgents.slice(0, 5).map((agent: Agent, index: number) => (
      <AgentItem
        key={agent.name}
        agent={agent}
        index={index}
        maxRevenue={maxAgentRevenue}
      />
    ));
  }, [topAgents, maxAgentRevenue, navigate]);

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

      {/* KPI Cards - Modern Design */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Revenue This Month"
          value={kpiValues.revenue}
          icon={IndianRupee}
          change={kpiValues.revenueChange}
          period="vs last month"
          cardType="revenue"
        />
        <KpiCard
          title="Active Properties"
          value={kpiValues.activeProperties}
          icon={Building2}
          change={kpiValues.activeChange}
          period="vs last month"
          cardType="active"
        />
        <KpiCard
          title="Leads Today"
          value={kpiValues.leadsToday}
          icon={Users}
          change={kpiValues.leadsChange}
          period="vs yesterday"
          cardType="leads"
        />
        <KpiCard
          title="Total Properties"
          value={kpiValues.totalProperties}
          icon={TrendingUp}
          change={kpiValues.totalChange}
          period="vs last month"
          cardType="properties"
        />
      </div>

      {/* Chart and Agents */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Monthly Performance</h3>
              <button
                onClick={() => navigate("/analytics")}
                className="text-xs sm:text-sm text-primary hover:underline inline-flex items-center gap-1 transition-all"
              >
                <span className="hidden sm:inline">View Full Reports</span>
                <span className="sm:hidden">View All</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[400px] rounded-2xl" />
                ))}
              </div>
            ) : recentProperties.length > 0 ? (
              <div className="property-carousel-container">
                {/* Carousel Navigation Buttons */}
                {recentProperties.length > 3 && (
                  <>
                    <button
                      className="carousel-nav-button prev"
                      onClick={handlePreviousProperty}
                      disabled={currentPropertyIndex === 0}
                    >
                      <ChevronLeft className="carousel-nav-icon" />
                    </button>
                    
                    <button
                      className="carousel-nav-button next"
                      onClick={handleNextProperty}
                      disabled={currentPropertyIndex >= recentProperties.length - 3}
                    >
                      <ChevronRight className="carousel-nav-icon" />
                    </button>
                  </>
                )}

                {/* Property Cards Carousel */}
                <div className="property-carousel-wrapper">
                  <div 
                    className="property-carousel-track"
                    style={{ 
                      transform: `translateX(-${currentPropertyIndex * (33.333 + 1.5)}%)` 
                    }}
                  >
                    {recentProperties.map((property: Property) => (
                      <div key={property.id} className="property-carousel-item">
                        <PropertySlide
                          property={property}
                          onNavigate={handlePropertyNavigation}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dots Indicator */}
                {recentProperties.length > 3 && (
                  <div className="carousel-dots">
                    {Array.from({ length: Math.max(1, recentProperties.length - 2) }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPropertyIndex(index)}
                        className={cn(
                          "carousel-dot",
                          currentPropertyIndex === index && "active"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
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
                onClick={() => navigate("/messages")}
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
                onClick={() => navigate("/calendar")}
              >
                <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Schedule</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
                onClick={() => navigate("/calendar")}
              >
                <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Add Task</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
                onClick={() => navigate("/analytics")}
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
