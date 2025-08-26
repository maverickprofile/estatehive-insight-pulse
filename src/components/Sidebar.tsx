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
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import estateHiveLogo from '/favicon_eh.png'; // Make sure to add your logo to this path

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

const quickActions = [
  { 
    name: "Add Property", 
    icon: PlusCircle, 
    color: "text-primary",
    action: 'add_property'
  },
  { 
    name: "Add Lead", 
    icon: Users, 
    color: "text-accent",
    action: 'add_lead'
  },
  { 
    name: "View Analytics", 
    icon: TrendingUp, 
    color: "text-success",
    action: 'view_analytics'
  },
];

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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_property':
        navigate('/properties/new');
        break;
      case 'add_lead':
        navigate('/leads');
        break;
      case 'view_analytics':
        navigate('/analytics');
        break;
      default:
        break;
    }
  };

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


      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => isMobile && onClose?.()}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isCollapsed && !isMobile && "justify-center"
                )}
                title={isCollapsed && !isMobile ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Quick Actions */}
        {(!isCollapsed || isMobile) && (
          <div className="pt-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    onClick={() => {
                      handleQuickAction(action.action);
                      isMobile && onClose?.();
                    }}
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
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <NavLink
          to="/settings"
          onClick={() => isMobile && onClose?.()}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
            "text-sidebar-foreground hover:bg-sidebar-accent",
            isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
            isCollapsed && !isMobile && "justify-center"
          )}
          title={isCollapsed && !isMobile ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Settings</span>}
        </NavLink>
      </div>
    </div>
    </>
  );
}
