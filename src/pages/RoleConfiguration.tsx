import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';
import {
  Shield,
  Users,
  Settings,
  Plus,
  Edit,
  Trash,
  Save,
  X,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  UserCheck,
  FileText,
  Database,
  Zap,
  Eye,
} from 'lucide-react';
import {
  UserRole,
  RolePermissions,
  UserRoleAssignment,
  ApprovalWorkflow,
  AutoApprovalRule,
  EntityType,
  ActionType,
} from '@/types/approval.types';

export default function RoleConfiguration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [autoRules, setAutoRules] = useState<AutoApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showAutoRuleDialog, setShowAutoRuleDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRoles(),
        loadWorkflows(),
        loadAutoRules(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('hierarchy_level', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles',
        variant: 'destructive',
      });
    }
  };

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const loadAutoRules = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_approval_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setAutoRules(data || []);
    } catch (error) {
      console.error('Error loading auto-approval rules:', error);
    }
  };

  const handleSaveRole = async (roleData: Partial<UserRole>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const role = {
        ...roleData,
        organization_id: user.id,
        is_system_role: false,
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from('user_roles')
          .update(role)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Role updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert(role);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Role created successfully',
        });
      }

      setShowRoleDialog(false);
      setEditingItem(null);
      await loadRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
      await loadRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete role',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role & Permission Configuration</h1>
          <p className="text-muted-foreground">
            Manage user roles, approval workflows, and auto-approval rules
          </p>
        </div>
        <Button onClick={loadAllData} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">User Roles</TabsTrigger>
          <TabsTrigger value="workflows">Approval Workflows</TabsTrigger>
          <TabsTrigger value="auto-rules">Auto-Approval Rules</TabsTrigger>
        </TabsList>

        {/* User Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Roles</CardTitle>
                  <CardDescription>
                    Define roles and their permissions for CRM actions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setShowRoleDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Hierarchy Level</TableHead>
                      <TableHead>Approval Levels</TableHead>
                      <TableHead>Auto-Approve</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{role.role_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.role_code}</Badge>
                        </TableCell>
                        <TableCell>{role.hierarchy_level}</TableCell>
                        <TableCell>
                          <Badge>{role.approval_levels} level(s)</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {role.can_auto_approve ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.is_active ? 'default' : 'secondary'}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingItem(role);
                                setShowRoleDialog(true);
                              }}
                              disabled={role.is_system_role}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={role.is_system_role}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approval Workflows</CardTitle>
                  <CardDescription>
                    Configure approval workflows for different CRM actions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setShowWorkflowDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workflow.workflow_name}</h3>
                            <Badge>{workflow.entity_type}</Badge>
                            <Badge variant="outline">{workflow.action_type}</Badge>
                          </div>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground">{workflow.description}</p>
                          )}
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{workflow.min_approvers} approver(s) required</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              <span>{workflow.approval_sequence}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Priority: {workflow.priority}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Switch checked={workflow.is_active} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(workflow);
                              setShowWorkflowDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Approval Rules Tab */}
        <TabsContent value="auto-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Auto-Approval Rules</CardTitle>
                  <CardDescription>
                    Define conditions for automatic approval of CRM actions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setShowAutoRuleDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {autoRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{rule.rule_name}</h3>
                            <Badge>{rule.entity_type}</Badge>
                            <Badge variant="outline">{rule.action_type}</Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span>Used {rule.usage_count} times</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Priority: {rule.priority}</span>
                            </div>
                            {rule.stop_on_match && (
                              <Badge variant="secondary">Stop on match</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Switch checked={rule.is_active} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(rule);
                              setShowAutoRuleDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              Define role permissions and approval capabilities
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            role={editingItem}
            onSave={handleSaveRole}
            onCancel={() => {
              setShowRoleDialog(false);
              setEditingItem(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Role Form Component
function RoleForm({
  role,
  onSave,
  onCancel,
}: {
  role?: UserRole | null;
  onSave: (data: Partial<UserRole>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<UserRole>>({
    role_name: role?.role_name || '',
    role_code: role?.role_code || '',
    description: role?.description || '',
    hierarchy_level: role?.hierarchy_level || 1,
    approval_levels: role?.approval_levels || 1,
    can_auto_approve: role?.can_auto_approve || false,
    is_active: role?.is_active ?? true,
    permissions: role?.permissions || {
      create: [],
      read: [],
      update: [],
      delete: [],
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role_name">Role Name</Label>
          <Input
            id="role_name"
            value={formData.role_name}
            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role_code">Role Code</Label>
          <Input
            id="role_code"
            value={formData.role_code}
            onChange={(e) => setFormData({ ...formData, role_code: e.target.value })}
            placeholder="e.g., admin, manager, agent"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the role's responsibilities"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hierarchy_level">Hierarchy Level</Label>
          <Input
            id="hierarchy_level"
            type="number"
            value={formData.hierarchy_level}
            onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })}
            min={1}
            max={10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="approval_levels">Approval Levels</Label>
          <Input
            id="approval_levels"
            type="number"
            value={formData.approval_levels}
            onChange={(e) => setFormData({ ...formData, approval_levels: parseInt(e.target.value) })}
            min={1}
            max={5}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="can_auto_approve">Can Auto-Approve</Label>
          <Switch
            id="can_auto_approve"
            checked={formData.can_auto_approve}
            onCheckedChange={(checked) => setFormData({ ...formData, can_auto_approve: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Role
        </Button>
      </DialogFooter>
    </form>
  );
}