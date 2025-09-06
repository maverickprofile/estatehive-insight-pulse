import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, User, Settings, LogOut, Menu, CheckCheck, X, Command } from "lucide-react";
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

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [profile, setProfile] = useState<{ full_name: string; role: string; avatar_url: string | null } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);

  // Global search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Search with unified placeholder and Cmd/Ctrl+K support */}
      <div className="flex-1 max-w-md ml-2 md:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            id="global-search"
            type="text" 
            placeholder="Search properties, leads, clients..." 
            className="w-full pl-10 pr-24 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        {/* Notifications with improved spacing */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative focus-ring">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs"
                          style={{ marginTop: '4px', marginRight: '4px' }}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
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
                        <DropdownMenuItem key={n.id} className={`flex items-start gap-1 p-3 ${!n.is_read && 'bg-muted/50'}`} onSelect={(e) => { e.preventDefault(); if (n.action_url) navigate(n.action_url); }}>
                            <div className="flex-1 flex flex-col items-start">
                                <p className="font-semibold">{n.title}</p>
                                <p className="text-xs text-muted-foreground">{n.message || n.description}</p>
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

        {/* User Menu with improved avatar size and focus ring */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 px-1 md:px-3 focus-ring" 
              style={{ minHeight: 'var(--hit-target-min)', minWidth: 'var(--hit-target-min)' }}
            >
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User avatar'} />
                <AvatarFallback className="bg-primary/10">
                  {profile ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-5 w-5" />}
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
