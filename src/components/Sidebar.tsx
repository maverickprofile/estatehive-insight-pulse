import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings, 
  BarChart3,
  Home,
  PlusCircle,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Bot,
  Receipt,
  Briefcase,
  X,
  Menu,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import estateHiveLogo from '/favicon_eh.png';

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
    name: "Agents", // New Menu Item
    icon: Briefcase, 
    path: "/agents" 
  },
  { 
    name: "Analytics", 
    icon: BarChart3, 
    path: "/analytics" 
  },
  { 
    name: "Invoices", // New Menu Item
    icon: Receipt, 
    path: "/invoices" 
  },
  { 
    name: "Ads Manager", 
    icon: Megaphone, 
    path: "/ads-manager" 
  },
  { 
    name: "Calendar", 
    icon: Calendar, 
    path: "/calendar" 
  },
  { 
    name: "AI Tools", 
    icon: Bot, 
    path: "/ai-tools" 
  },
  { 
    name: "Messages", 
    icon: MessageSquare, 
    path: "/messages" 
  },
];

// Removed duplicate quick actions that appear in dashboard
// These will be context-aware based on current page

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-all duration-300",
        isCollapsed && !isMobile ? "w-20" : "w-64",
        isMobile && "fixed left-0 top-0 z-50",
        isMobile && !isOpen && "-translate-x-full"
      )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <img src={estateHiveLogo} alt="Estate Hive Logo" className="w-8 h-8 rounded-lg" />
            <div>
              <h1 className="font-bold text-sidebar-foreground">Estate Hive</h1>
              <p className="text-xs text-muted-foreground">powered by Propli</p>
            </div>
          </div>
        )}
        {isCollapsed && !isMobile && (
          <div className="flex items-center justify-center w-full">
            <img src={estateHiveLogo} alt="Estate Hive Logo" className="w-8 h-8 rounded-lg" />
          </div>
        )}
        {isMobile ? (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors md:hidden"
          >
            <X className="w-4 h-4 text-sidebar-foreground" />
          </button>
        ) : (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors hidden md:block", isCollapsed && "hidden")}
          >
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
          </button>
        )}
      </div>
      {isCollapsed && !isMobile && (
        <div className="p-4 border-b border-sidebar-border">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors w-full flex justify-center"
          >
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          </button>
        </div>
      )}


      {/* Navigation with improved icon sizes and tooltips */}
      <nav className="flex-1 p-4 space-y-2">
        <TooltipProvider delayDuration={0}>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const NavItem = (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => isMobile && onClose?.()}
                  className={({ isActive }) => cn(
                    "nav-link group relative",
                    isActive && "active",
                    isCollapsed && !isMobile && "justify-center px-2"
                  )}
                >
                  <Icon 
                    className="flex-shrink-0" 
                    style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)', strokeWidth: 2 }}
                  />
                  {(!isCollapsed || isMobile) && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </NavLink>
              );

              // Wrap in tooltip only when collapsed
              if (isCollapsed && !isMobile) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {NavItem}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavItem;
            })}
          </div>
        </TooltipProvider>

        {/* Removed duplicate Quick Actions section */}
      </nav>

      {/* Settings with tooltip */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <TooltipProvider delayDuration={0}>
          {isCollapsed && !isMobile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/settings"
                  onClick={() => isMobile && onClose?.()}
                  className={({ isActive }) => cn(
                    "nav-link",
                    isActive && "active",
                    "justify-center px-2"
                  )}
                >
                  <Settings 
                    style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)', strokeWidth: 2 }}
                  />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Settings
              </TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/settings"
              onClick={() => isMobile && onClose?.()}
              className={({ isActive }) => cn(
                "nav-link",
                isActive && "active"
              )}
            >
              <Settings 
                style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)', strokeWidth: 2 }}
              />
              <span className="font-medium">Settings</span>
            </NavLink>
          )}
        </TooltipProvider>
      </div>
    </div>
    </>
  );
}
