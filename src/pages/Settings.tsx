import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Settings as SettingsIcon,
  Bell,
  Lock,
  User,
  Mail,
  Phone,
  Building2
} from "lucide-react";
import TeamManagement from "@/components/TeamManagement";
import { useOrganization } from "@/contexts/OrganizationContext";

const teamMembers = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul.sharma@estate.com",
    phone: "+91 98765 43210",
    role: "Admin",
    status: "active",
    lastLogin: "2 hours ago",
    permissions: ["all"]
  },
  {
    id: 2,
    name: "Priya Singh",
    email: "priya.singh@estate.com",
    phone: "+91 87654 32109",
    role: "Sales Manager",
    status: "active",
    lastLogin: "1 day ago",
    permissions: ["properties", "leads", "clients"]
  },
  {
    id: 3,
    name: "Amit Kumar",
    email: "amit.kumar@estate.com",
    phone: "+91 76543 21098",
    role: "Sales Agent",
    status: "active",
    lastLogin: "3 hours ago",
    permissions: ["leads", "clients"]
  },
  {
    id: 4,
    name: "Sneha Patel",
    email: "sneha.patel@estate.com",
    phone: "+91 65432 10987",
    role: "Support",
    status: "inactive",
    lastLogin: "1 week ago",
    permissions: ["clients"]
  }
];

const roleColors = {
  Admin: "bg-destructive text-destructive-foreground",
  "Sales Manager": "bg-primary text-primary-foreground",
  "Sales Agent": "bg-accent text-accent-foreground",
  Support: "bg-secondary text-secondary-foreground"
};

const statusColors = {
  active: "bg-success text-success-foreground",
  inactive: "bg-muted text-muted-foreground"
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("team");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account, team, and application preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="metric-card">
        <div className="flex overflow-x-auto border-b border-border scrollbar-hide">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === "team"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 mr-1 sm:mr-2 inline" />
            <span className="text-sm sm:text-base">Team</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === "notifications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="w-4 h-4 mr-1 sm:mr-2 inline" />
            <span className="text-sm sm:text-base">Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === "security"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-4 h-4 mr-1 sm:mr-2 inline" />
            <span className="text-sm sm:text-base">Security</span>
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SettingsIcon className="w-4 h-4 mr-1 sm:mr-2 inline" />
            <span className="text-sm sm:text-base">General</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Team Management Tab */}
          {activeTab === "team" && <TeamManagement />}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Notification Preferences</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Configure how you receive notifications</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">Push Notifications</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive push notifications in your browser</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">Email Notifications</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Get notified via email about important updates</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border rounded-lg gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-foreground">SMS Notifications</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive SMS alerts for urgent matters</p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Security Settings</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your account security and authentication</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-medium text-foreground">Change Password</h4>
                  <div className="space-y-2 sm:space-y-3">
                    <Input type="password" placeholder="Current password" className="text-sm" />
                    <Input type="password" placeholder="New password" className="text-sm" />
                    <Input type="password" placeholder="Confirm new password" className="text-sm" />
                    <Button className="w-full text-sm sm:text-base">Update Password</Button>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-medium text-foreground">Two-Factor Authentication</h4>
                  <div className="p-3 sm:p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm font-medium">2FA Status</span>
                      <Badge variant="secondary" className="bg-destructive text-destructive-foreground text-xs">
                        Disabled
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" className="w-full text-sm sm:text-base">Enable 2FA</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">General Settings</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Configure general application preferences</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-medium text-foreground">Company Information</h4>
                  <div className="space-y-2 sm:space-y-3">
                    <Input placeholder="Company Name" defaultValue="Estate CRM" className="text-sm" />
                    <Input placeholder="Company Address" defaultValue="Mumbai, Maharashtra" className="text-sm" />
                    <Input placeholder="Contact Number" defaultValue="+91 98765 43210" className="text-sm" />
                    <Input placeholder="Email" defaultValue="info@estate.com" className="text-sm" />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-base font-medium text-foreground">Application Preferences</h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2 block">Currency</label>
                      <Select defaultValue="inr">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                          <SelectItem value="usd">US Dollar ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2 block">Time Zone</label>
                      <Select defaultValue="ist">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                          <SelectItem value="utc">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2 block">Language</label>
                      <Select defaultValue="en">
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-border">
                <Button className="bg-gradient-to-r from-primary to-primary/90 w-full sm:w-auto text-sm sm:text-base">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}