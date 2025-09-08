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
  UserCheck,
  Bot,
  IndianRupee,
  Briefcase,
  X,
  Menu,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
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
    icon: IndianRupee, 
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
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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
        "bg-sidebar border-r border-sidebar-border h-screen flex flex-col transition-all duration-300 flex-shrink-0 w-64",
        isMobile && "fixed left-0 top-0 z-50",
        isMobile && !isOpen && "-translate-x-full"
      )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={estateHiveLogo} alt="Estate Hive Logo" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="font-bold text-sidebar-foreground">Estate Hive</h1>
            <p className="text-xs text-muted-foreground">powered by Propli</p>
          </div>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors md:hidden"
          >
            <X className="w-4 h-4 text-sidebar-foreground" />
          </button>
        )}
      </div>


      {/* Navigation with improved icon sizes and tooltips */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => isMobile && onClose?.()}
                className={({ isActive }) => cn(
                  "nav-link group relative",
                  isActive && "active"
                )}
              >
                <Icon 
                  className="flex-shrink-0" 
                  style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)', strokeWidth: 2 }}
                />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Removed duplicate Quick Actions section */}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
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
      </div>
    </div>
    </>
  );
}
