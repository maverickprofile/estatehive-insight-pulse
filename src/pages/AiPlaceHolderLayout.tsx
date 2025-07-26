import React, { useState } from 'react';
import { NavLink } from "react-router-dom";
import { 
  Bot, MessageCircle, Star, Clock, Bell, Settings, Shield, FileText, Mic, Scale, GraduationCap, Zap, LucideIcon, 
  Building2, Users, TrendingUp, MapPin, BarChart3, Home, PlusCircle, Calendar, ChevronLeft, ChevronRight, UserCheck,
  User, Search, LogOut
} from 'lucide-react';
import AiAgentsContent from "@/pages/AiPlaceHolder"; // Importing the content part

// --- Utility Function (from "@/lib/utils") ---
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

// --- Placeholder UI Components (from "@/components/ui/*") ---
const Button = ({ variant, size, className, children, ...props }: { variant?: string, size?: string, className?: string, children: React.ReactNode, [key: string]: any }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ${className}`} {...props}>
        {children}
    </button>
);
const Badge = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
        {children}
    </span>
);
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left">{children}</div>;
const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => <div>{children}</div>;
const DropdownMenuContent = ({ children, className, align }: { children: React.ReactNode, className?: string, align?: string }) => <div className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>{children}</div>;
const DropdownMenuItem = ({ children, className }: { children: React.ReactNode, className?: string }) => <a href="#" className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}>{children}</a>;
const DropdownMenuSeparator = () => <div className="border-t border-gray-100 my-1"></div>;
// --- End of Placeholders ---

// --- Sidebar Component ---
const menuItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "AI Automations", icon: User, path: "/ai-agents" },
  { name: "Properties", icon: Building2, path: "/properties" },
  { name: "Leads", icon: Users, path: "/leads" },
  { name: "Clients", icon: UserCheck, path: "/clients" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "Reports", icon: FileText, path: "/reports" },
  { name: "Calendar", icon: Calendar, path: "/calendar" },
  { name: "Messages", icon: MessageCircle, path: "/messages" },
];

const quickActions = [
  { name: "Add Property", icon: PlusCircle, color: "text-primary" },
  { name: "Add Lead", icon: Users, color: "text-accent" },
  { name: "View Analytics", icon: TrendingUp, color: "text-success" },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 h-screen flex-col transition-all duration-300 hidden lg:flex",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Estate CRM</h1>
              <p className="text-xs text-gray-500">Property Management</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center" : "",
                  isActive 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {!isCollapsed && (
          <div className="pt-6">
            <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icon className={cn("w-4 h-4", action.color)} />
                    <span>{action.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-colors",
            isCollapsed ? "justify-center" : "",
            isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </div>
  );
}

// --- Header Component ---
const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search properties, leads, or clients..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">3</Badge>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800">Rahul Sharma</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 hover:bg-red-50"><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// --- Main Page Wrapper ---
const AiAgentsLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <AiAgentsContent />
        </main>
      </div>
    </div>
  );
};

export default AiAgentsLayout;
