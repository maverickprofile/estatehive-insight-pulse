import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  MapPin, 
  FileText, 
  Settings, 
  BarChart3,
  Home,
  PlusCircle,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { 
    name: "Dashboard", 
    icon: Home, 
    path: "/" 
  },
  { 
    name: "Properties", 
    icon: Building2, 
    path: "/properties" 
  },
  { 
    name: "Leads", 
    icon: Users, 
    path: "/leads" 
  },
  { 
    name: "Clients", 
    icon: UserCheck, 
    path: "/clients" 
  },
  { 
    name: "Analytics", 
    icon: BarChart3, 
    path: "/analytics" 
  },
  { 
    name: "Reports", 
    icon: FileText, 
    path: "/reports" 
  },
  { 
    name: "Calendar", 
    icon: Calendar, 
    path: "/calendar" 
  },
  { 
    name: "Messages", 
    icon: MessageSquare, 
    path: "/messages" 
  },
];

const quickActions = [
  { 
    name: "Add Property", 
    icon: PlusCircle, 
    color: "text-primary" 
  },
  { 
    name: "Add Lead", 
    icon: Users, 
    color: "text-accent" 
  },
  { 
    name: "View Analytics", 
    icon: TrendingUp, 
    color: "text-success" 
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">Estate CRM</h1>
              <p className="text-xs text-muted-foreground">Property Management</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "nav-link",
                  isActive && "active"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="pt-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
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

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "nav-link",
            isActive && "active"
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