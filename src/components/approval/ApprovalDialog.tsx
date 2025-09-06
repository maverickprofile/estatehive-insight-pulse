import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Shield,
  FileText,
  Edit3,
  ArrowRight,
} from 'lucide-react';
import { approvalService } from '@/services/approval.service';
import {
  ApprovalRequest,
  ApprovalPreview,
  ChangedField,
  ApproverInfo,
  Priority,
} from '@/types/approval.types';

interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  onApprove?: (requestId: string, modifiedData?: Record<string, any>) => void;
  onReject?: (requestId: string, reason?: string) => void;
  currentUserId: string;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  onClose,
  requestId,
  onApprove,
  onReject,
  currentUserId,
}) => {
  const [preview, setPreview] = useState<ApprovalPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [modifiedData, setModifiedData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('changes');

  useEffect(() => {
    if (open && requestId) {
      loadApprovalPreview();
    }
  }, [open, requestId]);

  const loadApprovalPreview = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getApprovalPreview(requestId, currentUserId);
      setPreview(data);
      setModifiedData(data.proposed_changes || {});
    } catch (error) {
      console.error('Error loading approval preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await approvalService.processApprovalAction({
        request_id: requestId,
        action: 'approve',
        modified_data: modifiedData,
        notes: reason,
      });
      onApprove?.(requestId, modifiedData);
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await approvalService.processApprovalAction({
        request_id: requestId,
        action: 'reject',
        reason,
      });
      onReject?.(requestId, reason);
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    try {
      setSubmitting(true);
      await approvalService.processApprovalAction({
        request_id: requestId,
        action: 'request_changes',
        reason,
      });
      onClose();
    } catch (error) {
      console.error('Error requesting changes:', error);
    } finally {
      setSubmitting(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderFieldChange = (field: ChangedField) => {
    return (
      <div key={field.field_name} className="py-3 border-b last:border-0">
        <div className="flex items-start justify-between mb-2">
          <span className="font-medium text-sm">
            {field.field_label}
            {field.is_critical && (
              <Badge variant="destructive" className="ml-2 text-xs">Critical</Badge>
            )}
          </span>
          <Badge variant="outline" className="text-xs">
            {field.change_type}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-xs text-red-600 dark:text-red-400 mb-1">Before</div>
            <div className="text-sm font-mono">
              {field.old_value === null || field.old_value === undefined
                ? <span className="text-gray-400">Empty</span>
                : String(field.old_value)}
            </div>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-xs text-green-600 dark:text-green-400 mb-1">After</div>
            <div className="text-sm font-mono">
              {field.new_value === null || field.new_value === undefined
                ? <span className="text-gray-400">Empty</span>
                : String(field.new_value)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !preview) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Approval Details</DialogTitle>
            <DialogDescription>Please wait while we fetch the approval request details...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Approval Required
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(preview.request.status)}
              <Badge className={getPriorityColor(preview.request.priority)}>
                {preview.request.priority}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Review and approve the following {preview.request.entity_type} {preview.request.action_type} request
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="approvers">Approvers</TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Request Details</CardTitle>
                  <CardDescription>
                    {preview.request.change_summary || 'Review the proposed changes below'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {preview.request.request_reason && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{preview.request.request_reason}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requested by:</span>
                      <span className="font-medium">{preview.request.requested_by}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requested at:</span>
                      <span className="font-medium">
                        {new Date(preview.request.requested_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires at:</span>
                      <span className="font-medium">
                        {new Date(preview.request.expires_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Proposed Changes</CardTitle>
                  <CardDescription>
                    {preview.changed_fields.length} field(s) will be modified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {preview.changed_fields.map(renderFieldChange)}
                  </div>
                </CardContent>
              </Card>

              {preview.can_auto_approve && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This request is eligible for auto-approval based on configured rules.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="impact" className="space-y-4 mt-4">
              {preview.impact_analysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Impact Analysis</CardTitle>
                    <CardDescription>
                      Risk Level: 
                      <Badge className="ml-2" variant={
                        preview.impact_analysis.risk_level === 'high' ? 'destructive' :
                        preview.impact_analysis.risk_level === 'medium' ? 'default' : 'secondary'
                      }>
                        {preview.impact_analysis.risk_level}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {preview.impact_analysis.warnings && preview.impact_analysis.warnings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Warnings</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {preview.impact_analysis.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-yellow-600 dark:text-yellow-400">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {preview.impact_analysis.affected_entities && preview.impact_analysis.affected_entities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Affected Entities</h4>
                        <div className="space-y-2">
                          {preview.impact_analysis.affected_entities.map((entity, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {entity.entity_type}
                                </Badge>
                                <span className="text-sm font-medium">{entity.entity_name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {entity.impact_description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {preview.impact_analysis.recommendations && preview.impact_analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {preview.impact_analysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No impact analysis available for this request.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="approvers" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Approval Status</CardTitle>
                  <CardDescription>
                    {preview.request.approvals_received || 0} of {preview.request.approvals_required || 1} approvals received
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${((preview.request.approvals_received || 0) / (preview.request.approvals_required || 1)) * 100}%` 
                      }}
                    />
                  </div>

                  {preview.required_approvers && preview.required_approvers.length > 0 && (
                    <div className="space-y-2">
                      {preview.required_approvers.map((approver, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <div>
                              <p className="text-sm font-medium">{approver.user_name}</p>
                              <p className="text-xs text-muted-foreground">{approver.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {approver.has_approved ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-600">
                                  {approver.approval_time && new Date(approver.approval_time).toLocaleDateString()}
                                </span>
                              </>
                            ) : approver.can_approve ? (
                              <Badge variant="outline">Pending</Badge>
                            ) : (
                              <Badge variant="secondary">Cannot approve</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4">
            <Textarea
              placeholder="Add notes or reason (optional for approval, required for rejection)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleRequestChanges}
            disabled={submitting || !preview.user_can_approve}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Request Changes
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={submitting || !preview.user_can_approve || !reason}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={submitting || !preview.user_can_approve}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};