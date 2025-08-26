import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  settings?: any;
  subscription_plan?: string;
}

interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  permissions: any;
  is_active: boolean;
}

interface OrganizationContextType {
  organization: Organization | null;
  teamMember: TeamMember | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
  permissions: {
    properties: { create: boolean; read: boolean; update: boolean; delete: boolean };
    leads: { create: boolean; read: boolean; update: boolean; delete: boolean };
    clients: { create: boolean; read: boolean; update: boolean; delete: boolean };
    invoices: { create: boolean; read: boolean; update: boolean; delete: boolean };
    team: { invite: boolean; remove: boolean; edit: boolean };
    reports: { view: boolean; export: boolean };
  };
  refreshOrganization: () => Promise<void>;
  canAccess: (resource: string, action: string) => boolean;
}

const defaultPermissions = {
  properties: { create: false, read: false, update: false, delete: false },
  leads: { create: false, read: false, update: false, delete: false },
  clients: { create: false, read: false, update: false, delete: false },
  invoices: { create: false, read: false, update: false, delete: false },
  team: { invite: false, remove: false, edit: false },
  reports: { view: false, export: false },
};

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  teamMember: null,
  isSuperAdmin: false,
  isAdmin: false,
  isManager: false,
  loading: true,
  permissions: defaultPermissions,
  refreshOrganization: async () => {},
  canAccess: () => false,
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const { toast } = useToast();

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      setIsSuperAdmin(profile?.is_super_admin || false);

      // Get team member data
      const { data: member } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (member) {
        setTeamMember(member);
        
        // Get organization data
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', member.organization_id)
          .single();

        if (org) {
          setOrganization(org);
        }

        // Set permissions
        if (profile?.is_super_admin || member.role === 'super_admin') {
          // Super admin has all permissions
          setPermissions({
            properties: { create: true, read: true, update: true, delete: true },
            leads: { create: true, read: true, update: true, delete: true },
            clients: { create: true, read: true, update: true, delete: true },
            invoices: { create: true, read: true, update: true, delete: true },
            team: { invite: true, remove: true, edit: true },
            reports: { view: true, export: true },
          });
        } else if (member.role === 'admin') {
          // Admin has most permissions
          setPermissions({
            properties: { create: true, read: true, update: true, delete: true },
            leads: { create: true, read: true, update: true, delete: true },
            clients: { create: true, read: true, update: true, delete: true },
            invoices: { create: true, read: true, update: true, delete: false },
            team: { invite: true, remove: true, edit: true },
            reports: { view: true, export: true },
          });
        } else if (member.permissions) {
          // Use custom permissions from database
          setPermissions(member.permissions);
        } else {
          // Default permissions based on role
          const rolePermissions = getRolePermissions(member.role);
          setPermissions(rolePermissions);
        }
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'manager':
        return {
          properties: { create: true, read: true, update: true, delete: false },
          leads: { create: true, read: true, update: true, delete: false },
          clients: { create: true, read: true, update: true, delete: false },
          invoices: { create: true, read: true, update: true, delete: false },
          team: { invite: false, remove: false, edit: false },
          reports: { view: true, export: true },
        };
      case 'agent':
        return {
          properties: { create: true, read: true, update: true, delete: false },
          leads: { create: true, read: true, update: true, delete: false },
          clients: { create: true, read: true, update: true, delete: false },
          invoices: { create: false, read: true, update: false, delete: false },
          team: { invite: false, remove: false, edit: false },
          reports: { view: true, export: false },
        };
      case 'viewer':
        return {
          properties: { create: false, read: true, update: false, delete: false },
          leads: { create: false, read: true, update: false, delete: false },
          clients: { create: false, read: true, update: false, delete: false },
          invoices: { create: false, read: true, update: false, delete: false },
          team: { invite: false, remove: false, edit: false },
          reports: { view: true, export: false },
        };
      default:
        return defaultPermissions;
    }
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (isSuperAdmin) return true;
    
    const resourcePermissions = permissions[resource as keyof typeof permissions];
    if (!resourcePermissions) return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] || false;
  };

  const isAdmin = teamMember?.role === 'admin' || teamMember?.role === 'super_admin' || isSuperAdmin;
  const isManager = isAdmin || teamMember?.role === 'manager';

  useEffect(() => {
    fetchOrganizationData();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchOrganizationData();
      } else if (event === 'SIGNED_OUT') {
        setOrganization(null);
        setTeamMember(null);
        setIsSuperAdmin(false);
        setPermissions(defaultPermissions);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value: OrganizationContextType = {
    organization,
    teamMember,
    isSuperAdmin,
    isAdmin,
    isManager,
    loading,
    permissions,
    refreshOrganization: fetchOrganizationData,
    canAccess,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};