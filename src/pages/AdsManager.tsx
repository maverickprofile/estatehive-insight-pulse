import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Megaphone,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
  Settings,
  Plus,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
  Share2,
  Lock,
  AlertCircle,
  IndianRupee,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import './ads-manager.css';
import './ads-manager-tabs.css';
import './campaign-cards.css';

// Mock data for demonstration
const campaignStats = {
  totalSpend: 345678,
  totalReach: 1234500,
  totalClicks: 45300,
  totalConversions: 892,
  roi: 4.2,
  activeCampaigns: 12
};

export default function AdsManager() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile Coming Soon View
  if (isMobile) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-sm mx-auto">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-1">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <Megaphone className="h-10 w-10 text-purple-600" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">
            Ads Manager
          </h2>
          <p className="text-base text-muted-foreground mb-1">Coming Soon</p>
          <p className="text-sm text-muted-foreground/80 mb-6">
            Manage all your marketing campaigns in one place
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Facebook, title: 'Meta Ads', color: 'text-blue-500' },
              { icon: Globe, title: 'Google Ads', color: 'text-green-500' },
              { icon: Target, title: 'Smart Targeting', color: 'text-orange-500' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <feature.icon className={cn("h-5 w-5", feature.color)} />
                <span className="text-sm font-medium text-left">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Development Progress</span>
              <span className="font-medium">35%</span>
            </div>
            <Progress value={35} className="h-2" />
          </div>

          {/* CTA */}
          <Button disabled className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            In Development
          </Button>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/10">
      <div className="p-3 md:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 pb-8">
        {/* Dummy Data Alert */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Demo Data Notice</h4>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              All data displayed on this page is dummy data for demonstration purposes only. Actual campaign performance will be shown once you connect your advertising accounts.
            </p>
          </div>
        </div>

        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-pink-600/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white">
                  Ads Manager
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage all your marketing campaigns in one place
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {/* Total Spend Card */}
          <div className="stats-card group">
            <div className="stats-card-content">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <IndianRupee className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge className="stats-badge bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-bold">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  12%
                </Badge>
              </div>
              <div>
                <p className="stats-label">Total Spend</p>
                <p className="stats-value">₹{(campaignStats.totalSpend / 1000).toFixed(1)}K</p>
                <p className="stats-subtitle">This month</p>
              </div>
            </div>
          </div>

          {/* Reach Card */}
          <div className="stats-card group">
            <div className="stats-card-content">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge className="stats-badge bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-bold">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  23%
                </Badge>
              </div>
              <div>
                <p className="stats-label">Total Reach</p>
                <p className="stats-value">{(campaignStats.totalReach / 1000000).toFixed(1)}M</p>
                <p className="stats-subtitle">Unique users</p>
              </div>
            </div>
          </div>

          {/* Clicks Card */}
          <div className="stats-card group">
            <div className="stats-card-content">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <MousePointer className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <Badge className="stats-badge bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-bold">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  8%
                </Badge>
              </div>
              <div>
                <p className="stats-label">Total Clicks</p>
                <p className="stats-value">{(campaignStats.totalClicks / 1000).toFixed(1)}K</p>
                <p className="stats-subtitle">CTR: 3.67%</p>
              </div>
            </div>
          </div>

          {/* Conversions Card */}
          <div className="stats-card group">
            <div className="stats-card-content">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <Badge className="stats-badge bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 font-bold">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  5%
                </Badge>
              </div>
              <div>
                <p className="stats-label">Conversions</p>
                <p className="stats-value">{campaignStats.totalConversions}</p>
                <p className="stats-subtitle">CVR: 1.97%</p>
              </div>
            </div>
          </div>

          {/* ROI Card */}
          <div className="stats-card group">
            <div className="stats-card-content">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-pink-100 dark:bg-pink-900/30">
                  <TrendingUp className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <Badge className="stats-badge bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-bold">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  15%
                </Badge>
              </div>
              <div>
                <p className="stats-label">Return on Investment</p>
                <p className="stats-value">{campaignStats.roi}x</p>
                <p className="stats-subtitle">₹{(campaignStats.roi * 100).toFixed(0)} per ₹100</p>
              </div>
            </div>
          </div>

          {/* Active Campaigns Card */}
          <div className="stats-card group">
            <div className="stats-card-content">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <Badge className="stats-badge bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-bold">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <div>
                <p className="stats-label">Active Campaigns</p>
                <p className="stats-value">{campaignStats.activeCampaigns}</p>
                <p className="stats-subtitle">Across platforms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Platform Tabs */}
        <div className="custom-tabs-container">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="custom-tabs-list">
              <TabsTrigger value="all" className="custom-tab-trigger" data-value="all">
                <Globe className="custom-tab-icon" />
                <span>All Platforms</span>
              </TabsTrigger>
              <TabsTrigger value="meta" className="custom-tab-trigger" data-value="meta">
                <svg className="custom-tab-icon" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
                <span>Meta</span>
              </TabsTrigger>
              <TabsTrigger value="google" className="custom-tab-trigger" data-value="google">
                <svg className="custom-tab-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="custom-tab-trigger" data-value="instagram">
                <svg className="custom-tab-icon" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="instaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#feda75"/>
                      <stop offset="20%" stopColor="#fa7e1e"/>
                      <stop offset="40%" stopColor="#d62976"/>
                      <stop offset="60%" stopColor="#962fbf"/>
                      <stop offset="100%" stopColor="#4f5bd5"/>
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#instaGrad)"/>
                  <rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="white" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.8"/>
                  <circle cx="17" cy="7" r="1.2" fill="white"/>
                </svg>
                <span>Instagram</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="custom-tab-trigger" data-value="youtube">
                <svg className="custom-tab-icon" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
                </svg>
                <span>YouTube</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="custom-tab-trigger" data-value="linkedin">
                <svg className="custom-tab-icon" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5"/>
                </svg>
                <span>LinkedIn</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="custom-tab-content">
              {/* Campaign Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Meta Ads Card */}
                <div className="modern-campaign-card campaign-card-meta">
                  <div className="campaign-card-header">
                    <div className="campaign-card-logo">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                      </svg>
                    </div>
                    <span className="campaign-card-badge">Coming Soon</span>
                  </div>
                  
                  <h3 className="campaign-card-title">Meta Ads</h3>
                  <p className="campaign-card-subtitle">Facebook & Instagram</p>
                  
                  <div className="campaign-features">
                    <span className="campaign-feature-tag">Campaign Management</span>
                    <span className="campaign-feature-tag">Audience Targeting</span>
                    <span className="campaign-feature-tag">Ad Creative Builder</span>
                  </div>
                  
                  <div className="campaign-progress">
                    <div className="campaign-progress-bar">
                      <div className="campaign-progress-fill" style={{ width: '35%' }}></div>
                    </div>
                    <div className="campaign-progress-text">
                      <span>35% Complete</span>
                      <span className="text-xs">30 days ago</span>
                    </div>
                  </div>
                  
                  <button className="campaign-action-btn" disabled>
                    In Development
                  </button>
                </div>

                {/* Google Ads Card */}
                <div className="modern-campaign-card campaign-card-google">
                  <div className="campaign-card-header">
                    <div className="campaign-card-logo">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <span className="campaign-card-badge">Coming Soon</span>
                  </div>
                  
                  <h3 className="campaign-card-title">Google Ads</h3>
                  <p className="campaign-card-subtitle">Search & Display</p>
                  
                  <div className="campaign-features">
                    <span className="campaign-feature-tag">Search Campaigns</span>
                    <span className="campaign-feature-tag">Display Network</span>
                    <span className="campaign-feature-tag">Performance Max</span>
                  </div>
                  
                  <div className="campaign-progress">
                    <div className="campaign-progress-bar">
                      <div className="campaign-progress-fill" style={{ width: '25%' }}></div>
                    </div>
                    <div className="campaign-progress-text">
                      <span>25% Complete</span>
                      <span className="text-xs">45 days ago</span>
                    </div>
                  </div>
                  
                  <button className="campaign-action-btn" disabled>
                    In Development
                  </button>
                </div>

                {/* Instagram Ads Card */}
                <div className="modern-campaign-card campaign-card-instagram">
                  <div className="campaign-card-header">
                    <div className="campaign-card-logo">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <defs>
                          <linearGradient id="cardInstaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#feda75"/>
                            <stop offset="20%" stopColor="#fa7e1e"/>
                            <stop offset="40%" stopColor="#d62976"/>
                            <stop offset="60%" stopColor="#962fbf"/>
                            <stop offset="100%" stopColor="#4f5bd5"/>
                          </linearGradient>
                        </defs>
                        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#cardInstaGrad)"/>
                        <rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="white" strokeWidth="1.8"/>
                        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.8"/>
                        <circle cx="17" cy="7" r="1.2" fill="white"/>
                      </svg>
                    </div>
                    <span className="campaign-card-badge">Coming Soon</span>
                  </div>
                  
                  <h3 className="campaign-card-title">Instagram Ads</h3>
                  <p className="campaign-card-subtitle">Stories & Reels</p>
                  
                  <div className="campaign-features">
                    <span className="campaign-feature-tag">Story Ads</span>
                    <span className="campaign-feature-tag">Reels Promotion</span>
                    <span className="campaign-feature-tag">Influencer Collab</span>
                  </div>
                  
                  <div className="campaign-progress">
                    <div className="campaign-progress-bar">
                      <div className="campaign-progress-fill" style={{ width: '20%' }}></div>
                    </div>
                    <div className="campaign-progress-text">
                      <span>20% Complete</span>
                      <span className="text-xs">60 days ago</span>
                    </div>
                  </div>
                  
                  <button className="campaign-action-btn" disabled>
                    In Development
                  </button>
                </div>

                {/* YouTube Ads Card */}
                <div className="modern-campaign-card campaign-card-youtube">
                  <div className="campaign-card-header">
                    <div className="campaign-card-logo">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
                      </svg>
                    </div>
                    <span className="campaign-card-badge">Coming Soon</span>
                  </div>
                  
                  <h3 className="campaign-card-title">YouTube Ads</h3>
                  <p className="campaign-card-subtitle">Video Campaigns</p>
                  
                  <div className="campaign-features">
                    <span className="campaign-feature-tag">TrueView Ads</span>
                    <span className="campaign-feature-tag">Bumper Ads</span>
                    <span className="campaign-feature-tag">Discovery Ads</span>
                  </div>
                  
                  <div className="campaign-progress">
                    <div className="campaign-progress-bar">
                      <div className="campaign-progress-fill" style={{ width: '15%' }}></div>
                    </div>
                    <div className="campaign-progress-text">
                      <span>15% Complete</span>
                      <span className="text-xs">75 days ago</span>
                    </div>
                  </div>
                  
                  <button className="campaign-action-btn" disabled>
                    In Development
                  </button>
                </div>

                {/* LinkedIn Ads Card */}
                <div className="modern-campaign-card campaign-card-linkedin">
                  <div className="campaign-card-header">
                    <div className="campaign-card-logo">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0077B5"/>
                      </svg>
                    </div>
                    <span className="campaign-card-badge">Coming Soon</span>
                  </div>
                  
                  <h3 className="campaign-card-title">LinkedIn Ads</h3>
                  <p className="campaign-card-subtitle">B2B Marketing</p>
                  
                  <div className="campaign-features">
                    <span className="campaign-feature-tag">Sponsored Content</span>
                    <span className="campaign-feature-tag">Message Ads</span>
                    <span className="campaign-feature-tag">Lead Gen Forms</span>
                  </div>
                  
                  <div className="campaign-progress">
                    <div className="campaign-progress-bar">
                      <div className="campaign-progress-fill" style={{ width: '10%' }}></div>
                    </div>
                    <div className="campaign-progress-text">
                      <span>10% Complete</span>
                      <span className="text-xs">90 days ago</span>
                    </div>
                  </div>
                  
                  <button className="campaign-action-btn" disabled>
                    In Development
                  </button>
                </div>

              </div>

              {/* Coming Features Section */}
              <Card className="border-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Upcoming Features</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                        <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Advanced Analytics</p>
                        <p className="text-xs text-muted-foreground">Cross-platform performance metrics</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                        <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">AI Audience Builder</p>
                        <p className="text-xs text-muted-foreground">Smart audience segmentation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
                        <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Auto-Optimization</p>
                        <p className="text-xs text-muted-foreground">AI-powered campaign optimization</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                        <Sparkles className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Creative Studio</p>
                        <p className="text-xs text-muted-foreground">AI-generated ad creatives</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Campaign Scheduler</p>
                        <p className="text-xs text-muted-foreground">Automated campaign scheduling</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                        <Share2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Multi-Channel Sync</p>
                        <p className="text-xs text-muted-foreground">Unified campaign management</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meta Tab */}
            <TabsContent value="meta" className="custom-tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon-wrapper">
                  <Facebook className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="coming-soon-title">Meta Ads Integration</h3>
                <p className="coming-soon-description">
                  Connect your Facebook Business Manager to create and manage campaigns across Facebook and Instagram.
                </p>
                <div className="coming-soon-features">
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Target className="h-5 w-5" />
                    </div>
                    <span>Advanced Targeting</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <span>Performance Analytics</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span>Creative Tools</span>
                  </div>
                </div>
                <Button className="coming-soon-button" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </TabsContent>

            {/* Google Tab */}
            <TabsContent value="google" className="custom-tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon-wrapper">
                  <svg className="h-16 w-16 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h3 className="coming-soon-title">Google Ads Integration</h3>
                <p className="coming-soon-description">
                  Connect your Google Ads account to manage Search, Display, and YouTube campaigns.
                </p>
                <div className="coming-soon-features">
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Target className="h-5 w-5" />
                    </div>
                    <span>Search Campaigns</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Eye className="h-5 w-5" />
                    </div>
                    <span>Display Network</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Youtube className="h-5 w-5" />
                    </div>
                    <span>Video Ads</span>
                  </div>
                </div>
                <Button className="coming-soon-button" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </TabsContent>

            {/* Instagram Tab */}
            <TabsContent value="instagram" className="custom-tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon-wrapper instagram">
                  <Instagram className="h-16 w-16 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="coming-soon-title">Instagram Ads</h3>
                <p className="coming-soon-description">
                  Create stunning visual campaigns for Instagram Stories, Reels, and Feed posts.
                </p>
                <div className="coming-soon-features">
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                    <span>Story Ads</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span>Reels Promotion</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Users className="h-5 w-5" />
                    </div>
                    <span>Influencer Collab</span>
                  </div>
                </div>
                <Button className="coming-soon-button" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </TabsContent>

            {/* YouTube Tab */}
            <TabsContent value="youtube" className="custom-tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon-wrapper youtube">
                  <Youtube className="h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="coming-soon-title">YouTube Ads</h3>
                <p className="coming-soon-description">
                  Reach your audience with powerful video advertising on the world's largest video platform.
                </p>
                <div className="coming-soon-features">
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                    <span>TrueView Ads</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span>Bumper Ads</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Target className="h-5 w-5" />
                    </div>
                    <span>Discovery Ads</span>
                  </div>
                </div>
                <Button className="coming-soon-button" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </TabsContent>

            {/* LinkedIn Tab */}
            <TabsContent value="linkedin" className="custom-tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon-wrapper linkedin">
                  <Linkedin className="h-16 w-16 text-blue-700 dark:text-blue-400" />
                </div>
                <h3 className="coming-soon-title">LinkedIn Ads</h3>
                <p className="coming-soon-description">
                  Professional B2B marketing to reach decision-makers and industry leaders.
                </p>
                <div className="coming-soon-features">
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Users className="h-5 w-5" />
                    </div>
                    <span>Professional Targeting</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <Target className="h-5 w-5" />
                    </div>
                    <span>Lead Generation</span>
                  </div>
                  <div className="coming-soon-feature">
                    <div className="coming-soon-feature-icon">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <span>Account-Based Marketing</span>
                  </div>
                </div>
                <Button className="coming-soon-button" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}