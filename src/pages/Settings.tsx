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
  Phone
} from "lucide-react";

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account, team, and application preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="metric-card">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "team"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Team Management
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "notifications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="w-4 h-4 mr-2 inline" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-4 h-4 mr-2 inline" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SettingsIcon className="w-4 h-4 mr-2 inline" />
            General
          </button>
        </div>

        <div className="p-6">
          {/* Team Management Tab */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                  <p className="text-sm text-muted-foreground">Manage user access and permissions</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{member.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[member.role as keyof typeof roleColors]} variant="secondary">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[member.status as keyof typeof statusColors]} variant="secondary">
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{member.lastLogin}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">Configure how you receive notifications</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get notified via email about important updates</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive SMS alerts for urgent matters</p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your account security and authentication</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Change Password</h4>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                    <Button className="w-full">Update Password</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">2FA Status</span>
                      <Badge variant="secondary" className="bg-destructive text-destructive-foreground">
                        Disabled
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" className="w-full">Enable 2FA</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">General Settings</h3>
                <p className="text-sm text-muted-foreground">Configure general application preferences</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Company Information</h4>
                  <div className="space-y-3">
                    <Input placeholder="Company Name" defaultValue="Estate CRM" />
                    <Input placeholder="Company Address" defaultValue="Mumbai, Maharashtra" />
                    <Input placeholder="Contact Number" defaultValue="+91 98765 43210" />
                    <Input placeholder="Email" defaultValue="info@estate.com" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Application Preferences</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Currency</label>
                      <Select defaultValue="inr">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                          <SelectItem value="usd">US Dollar ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Time Zone</label>
                      <Select defaultValue="ist">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                          <SelectItem value="utc">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
                      <Select defaultValue="en">
                        <SelectTrigger>
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

              <div className="pt-4 border-t border-border">
                <Button className="bg-gradient-to-r from-primary to-primary/90">
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