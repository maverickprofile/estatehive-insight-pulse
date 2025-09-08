import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import './team-management.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Edit, 
  Send,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  is_active: boolean;
  profiles: {
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invited_by_name: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
  rejected: boolean;
  token: string;
}

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const { toast } = useToast();

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    fetchCurrentUser();
    fetchTeamData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First fetch the profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        // Then fetch the team member data separately
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .single();
        
        if (profile && teamMember) {
          const fullProfile = {
            ...profile,
            team_members: [teamMember]
          };
          setCurrentUser(fullProfile);
          
          // Fetch organization
          if (teamMember.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', teamMember.organization_id)
              .single();
            setOrganization(org);
          }
        } else {
          setCurrentUser(profile);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from('team_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData?.organization_id) return;

      // Fetch team members with their profiles
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', memberData.organization_id)
        .eq('is_active', true);

      if (membersError) throw membersError;
      
      // Fetch profiles for each team member
      const membersWithProfiles = await Promise.all(
        (members || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, avatar_url, phone')
            .eq('id', member.user_id)
            .single();
          
          return {
            ...member,
            profiles: profile
          };
        })
      );

      setTeamMembers(membersWithProfiles);

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('organization_id', memberData.organization_id)
        .eq('accepted', false)
        .eq('rejected', false)
        .gte('expires_at', new Date().toISOString());

      if (invitesError) throw invitesError;
      setInvitations(invites || []);
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Missing Information",
        description: "Please provide email and role",
        variant: "destructive",
      });
      return;
    }

    setSendingInvite(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's organization
      const { data: memberData } = await supabase
        .from('team_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData?.organization_id) throw new Error('No organization found');

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('team_invitations')
        .insert({
          organization_id: memberData.organization_id,
          email: inviteEmail,
          role: inviteRole,
          message: inviteMessage,
          invited_by: user.id,
          invited_by_name: currentUser?.full_name || currentUser?.email,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email (would typically use email service)
      const inviteLink = `${window.location.origin}/#/auth?invite=${invitation.token}`;
      
      toast({
        title: "Invitation Sent!",
        description: `Invitation sent to ${inviteEmail}`,
      });

      // Copy invite link to clipboard
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite Link Copied",
        description: "The invitation link has been copied to your clipboard",
      });

      // Reset form and close dialog
      setInviteEmail('');
      setInviteRole('agent');
      setInviteMessage('');
      setInviteDialogOpen(false);
      
      // Refresh invitations list
      fetchTeamData();
      
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });
      
      fetchTeamData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled",
      });
      
      fetchTeamData();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'agent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const canManageTeam = currentUser?.is_super_admin || 
    currentUser?.team_members?.[0]?.role === 'admin' ||
    currentUser?.team_members?.[0]?.role === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Team Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {organization?.name || 'Your Organization'} • {teamMembers.length} Members
          </p>
        </div>
        
        {canManageTeam && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Invite Member</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Welcome to the team! Looking forward to working with you..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  disabled={sendingInvite}
                >
                  Cancel
                </Button>
                <Button onClick={sendInvitation} disabled={sendingInvite}>
                  {sendingInvite ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Active Team Members</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your organization's team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto team-table-wrapper">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Name</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-xs sm:text-sm">Role</TableHead>
                <TableHead className="text-xs sm:text-sm hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-xs sm:text-sm">Status</TableHead>
                {canManageTeam && <TableHead className="text-xs sm:text-sm">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div>
                      <div>{member.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {member.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                    {member.profiles?.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs team-badge">
                      {member.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 text-xs team-badge">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Active</span>
                      <span className="sm:hidden">On</span>
                    </Badge>
                  </TableCell>
                  {canManageTeam && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="team-action-btn"
                        onClick={() => removeMember(member.id)}
                        disabled={member.role === 'super_admin'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Pending Invitations</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto team-table-wrapper">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Email</TableHead>
                  <TableHead className="text-xs sm:text-sm">Role</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Invited By</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Expires</TableHead>
                  {canManageTeam && <TableHead className="text-xs sm:text-sm">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="text-xs sm:text-sm">
                      <div>
                        <div>{invitation.email}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          by {invitation.invited_by_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs team-badge">
                        {invitation.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                      {invitation.invited_by_name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="team-action-btn"
                            onClick={() => {
                              const inviteLink = `${window.location.origin}/#/auth?invite=${invitation.token}`;
                              navigator.clipboard.writeText(inviteLink);
                              toast({
                                title: "Link Copied",
                                description: "Invitation link copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="team-action-btn"
                            onClick={() => cancelInvitation(invitation.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}