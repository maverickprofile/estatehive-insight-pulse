import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, User, Settings, LogOut, PanelLeft, CheckCheck, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useToast } from "./ui/use-toast";

// Function to fetch notifications
const fetchNotifications = async (userId: string) => {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export default function Header() {
  const [profile, setProfile] = useState<{ full_name: string; role: string; avatar_url: string | null } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          const { data, error } = await supabase
            .from('profiles')
            .select(`full_name, role, avatar_url`)
            .eq('id', session.user.id)
            .single();
          if (error) throw error;
          if (data) setProfile(data);
        }
        } catch (error) {
        console.error('Error fetching profile:', (error as Error).message);
        }
    };
    fetchUserAndProfile();
  }, []);

  // Fetch notifications using React Query
  const { data: notifications = [] } = useQuery({
      queryKey: ['notifications', userId],
      queryFn: () => fetchNotifications(userId!),
      enabled: !!userId,
  });

  // Real-time listener for new notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (import.meta.env.DEV) {
            console.debug('New notification received!', payload);
          }
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
          toast({
              title: "New Notification",
                description: (payload.new as { title: string }).title,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, toast]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsReadMutation = useMutation({
      mutationFn: async () => {
          if (!userId) return;
          const { error } = await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('user_id', userId)
              .eq('is_read', false);
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      }
  });

  const deleteNotificationMutation = useMutation({
      mutationFn: async (notificationId: number) => {
          const { error } = await supabase
              .from('notifications')
              .delete()
              .eq('id', notificationId);
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-4 md:px-6">
      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md ml-2 md:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm"/>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items/flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        {/* Notifications */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-border shadow-lg">
                <DropdownMenuLabel className="flex justify-between items-center">
                    Notifications
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => markAllAsReadMutation.mutate()}>
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                        <DropdownMenuItem key={n.id} className={`flex items-start gap-1 p-3 ${!n.is_read && 'bg-muted/50'}`} onSelect={(e) => { e.preventDefault(); if (n.link_to) navigate(n.link_to); }}>
                            <div className="flex-1 flex flex-col items-start">
                                <p className="font-semibold">{n.title}</p>
                                <p className="text-xs text-muted-foreground">{n.description}</p>
                                <p className="text-xs text-muted-foreground self-end mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents the dropdown item's onSelect from firing
                                    deleteNotificationMutation.mutate(n.id);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DropdownMenuItem>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center p-4">No new notifications</p>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-1 md:px-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User avatar'} />
                <AvatarFallback>
                  {profile ? profile.full_name.split(' ').map(n => n[0]).join('') : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{profile ? profile.full_name : 'Loading...'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile ? profile.role : '...'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg">
            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
