import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApprovalDialog } from '@/components/approval/ApprovalDialog';
import { ActionPreview } from '@/components/approval/ActionPreview';
import { designTokens } from '@/lib/design-tokens';
import { approvalService } from '@/services/approval.service';
import { auditService } from '@/services/audit.service';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  ApprovalRequest,
  ApprovalStatus,
  EntityType,
  Priority,
  ApprovalStatistics,
} from '@/types/approval.types';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  FileText,
  User,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

export default function ApprovalQueue() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState<ApprovalStatistics | null>(null);
  const [organizationId] = useState(() => {
    // Use a consistent organization ID for the demo
    return localStorage.getItem('organizationId') || (() => {
      const newId = uuidv4();
      localStorage.setItem('organizationId', newId);
      return newId;
    })();
  });
  
  const [currentUserId] = useState(() => {
    const user = supabase.auth.user;
    return user?.id || uuidv4();
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [entityFilter, setEntityFilter] = useState<EntityType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadApprovalRequests();
    loadStatistics();

    // Set up real-time subscription
    const channel = supabase
      .channel('approval-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_requests',
        },
        () => {
          loadApprovalRequests();
          loadStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, entityFilter, priorityFilter, searchQuery]);

  const loadApprovalRequests = async () => {
    try {
      setLoading(true);
      console.log('Loading approval requests...');
      
      const { data, error } = await supabase
        .from('approval_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading approval requests:', error);
        // Try to create table if it doesn't exist
        if (error.code === 'PGRST204' || error.message?.includes('relation')) {
          console.log('Approval requests table may not exist or has missing columns');
        }
        return;
      }

      console.log('Loaded approval requests:', data?.length || 0, 'requests');
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to load approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await auditService.getApprovalStatistics(organizationId);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Entity filter
    if (entityFilter !== 'all') {
      filtered = filtered.filter(r => r.entity_type === entityFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.change_summary?.toLowerCase().includes(query) ||
        r.request_reason?.toLowerCase().includes(query) ||
        r.entity_id?.toLowerCase().includes(query) ||
        r.requested_by?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || currentUserId;
      
      await approvalService.processApprovalAction(
        {
          request_id: requestId,
          action: 'approve',
        },
        userId
      );
      console.log('Approval processed successfully');
      await loadApprovalRequests();
      await loadStatistics();
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || currentUserId;
      
      await approvalService.processApprovalAction(
        {
          request_id: requestId,
          action: 'reject',
          reason,
        },
        userId
      );
      console.log('Rejection processed successfully');
      await loadApprovalRequests();
      await loadStatistics();
    } catch (error) {
      console.error('Error processing rejection:', error);
    }
  };

  const handleBulkApprove = async () => {
    const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
    for (const request of pendingRequests) {
      await handleApprove(request.id);
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
      case 'auto_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'partially_approved':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
      auto_approved: 'bg-blue-100 text-blue-800',
      partially_approved: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Queue</h1>
          <p className="text-muted-foreground">
            Manage and review pending CRM action approvals
          </p>
        </div>
        <Button onClick={loadApprovalRequests} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_requests}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="w-3 h-3 mr-1" />
                All time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.approval_rate.toFixed(1)}%
              </div>
              <div className="flex items-center text-xs">
                {statistics.approval_rate >= 70 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                )}
                <span className={statistics.approval_rate >= 70 ? 'text-green-600' : 'text-red-600'}>
                  {statistics.approved}/{statistics.total_requests} approved
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Approval Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.average_approval_time / 60)}m
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                Average time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Auto Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.auto_approved}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Shield className="w-3 h-3 mr-1" />
                By system rules
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={(value: any) => setEntityFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {statusFilter === 'pending' && filteredRequests.length > 0 && (
              <Button onClick={handleBulkApprove} variant="outline">
                Bulk Approve ({filteredRequests.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
          <CardDescription>
            {filteredRequests.length} request(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approval requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Approval Progress</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.change_summary || 'CRM Update'}</p>
                        {request.request_reason && (
                          <p className="text-xs text-muted-foreground">{request.request_reason}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{request.entity_type}</Badge>
                        {request.entity_id && (
                          <span className="text-xs text-muted-foreground">#{request.entity_id}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{request.requested_by}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {request.approvals_received}/{request.approvals_required}
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${(request.approvals_received / request.approvals_required) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(request.requested_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request.id);
                              setDialogOpen(true);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Quick Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReject(request.id, 'Quick rejection')}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Quick Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {selectedRequest && (
        <ApprovalDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}