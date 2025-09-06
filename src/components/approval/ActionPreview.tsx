import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  MapPin,
  FileText,
  Clock,
  Tag,
  CheckCircle,
  AlertCircle,
  Building,
  UserPlus,
  CalendarPlus,
  ListTodo,
  MessageSquare,
} from 'lucide-react';
import { AIDecision } from '@/types/voice-crm.types';
import { format } from 'date-fns';

interface ActionPreviewProps {
  decision: AIDecision;
  onApprove?: () => void;
  onReject?: () => void;
  onModify?: () => void;
  compact?: boolean;
}

export const ActionPreview: React.FC<ActionPreviewProps> = ({
  decision,
  onApprove,
  onReject,
  onModify,
  compact = false,
}) => {
  const getActionIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      create_lead: <UserPlus className="w-5 h-5" />,
      update_client: <User className="w-5 h-5" />,
      schedule_appointment: <CalendarPlus className="w-5 h-5" />,
      create_task: <ListTodo className="w-5 h-5" />,
      update_property: <Building className="w-5 h-5" />,
      send_message: <MessageSquare className="w-5 h-5" />,
      add_note: <FileText className="w-5 h-5" />,
    };
    return icons[type] || <AlertCircle className="w-5 h-5" />;
  };

  const getActionTitle = (type: string) => {
    const titles: Record<string, string> = {
      create_lead: 'Create New Lead',
      update_client: 'Update Client Information',
      schedule_appointment: 'Schedule Appointment',
      create_task: 'Create Task',
      update_property: 'Update Property',
      send_message: 'Send Message',
      add_note: 'Add Note to CRM',
      change_status: 'Change Status',
      assign_agent: 'Assign Agent',
      update_budget: 'Update Budget',
    };
    return titles[type] || type;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const renderLeadPreview = (params: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{params.name || 'Not provided'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium">{params.phone || 'Not provided'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{params.email || 'Not provided'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-sm font-medium">
              {params.budget_min && params.budget_max
                ? `₹${params.budget_min} - ₹${params.budget_max}`
                : 'Not specified'}
            </p>
          </div>
        </div>
      </div>
      {params.interested_in && (
        <div className="flex items-start gap-2">
          <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Interested In</p>
            <p className="text-sm">{params.interested_in}</p>
          </div>
        </div>
      )}
      {params.notes && (
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm">{params.notes}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppointmentPreview = (params: any) => (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Title</p>
          <p className="text-sm font-medium">{params.title}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Start Time</p>
            <p className="text-sm font-medium">
              {params.start_time ? format(new Date(params.start_time), 'PPp') : 'Not set'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium">{params.location || 'Not specified'}</p>
          </div>
        </div>
      </div>
      {params.description && (
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{params.description}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderTaskPreview = (params: any) => (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <ListTodo className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Task</p>
          <p className="text-sm font-medium">{params.title}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">
              {params.due_date ? format(new Date(params.due_date), 'PP') : 'Not set'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Assigned To</p>
            <p className="text-sm font-medium">{params.assigned_to || 'Unassigned'}</p>
          </div>
        </div>
      </div>
      {params.description && (
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{params.description}</p>
          </div>
        </div>
      )}
      {params.tags && params.tags.length > 0 && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {params.tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderClientUpdatePreview = (params: any) => (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <User className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Client ID</p>
          <p className="text-sm font-medium">{params.client_id}</p>
        </div>
      </div>
      <div className="border rounded-lg p-3 bg-muted/50">
        <p className="text-xs font-medium mb-2">Updates:</p>
        {Object.entries(params.updates || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center py-1">
            <span className="text-xs text-muted-foreground capitalize">
              {key.replace(/_/g, ' ')}:
            </span>
            <span className="text-xs font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotePreview = (params: any) => (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Note Content</p>
          <p className="text-sm whitespace-pre-wrap">{params.note_content}</p>
        </div>
      </div>
      {params.entity_id && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Related To</p>
            <p className="text-sm font-medium">Entity #{params.entity_id}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderActionParameters = () => {
    switch (decision.decision_type) {
      case 'create_lead':
        return renderLeadPreview(decision.parameters);
      case 'schedule_appointment':
        return renderAppointmentPreview(decision.parameters);
      case 'create_task':
        return renderTaskPreview(decision.parameters);
      case 'update_client':
        return renderClientUpdatePreview(decision.parameters);
      case 'add_note':
        return renderNotePreview(decision.parameters);
      default:
        return (
          <div className="text-sm text-muted-foreground">
            <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded">
              {JSON.stringify(decision.parameters, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {getActionIcon(decision.decision_type)}
          </div>
          <div>
            <p className="font-medium text-sm">{getActionTitle(decision.decision_type)}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getConfidenceColor(decision.confidence_score)}`}>
                {Math.round(decision.confidence_score * 100)}% confidence
              </Badge>
              <Badge className={`text-xs ${getPriorityColor(decision.priority)}`}>
                {decision.priority}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onModify && (
            <Button size="sm" variant="outline" onClick={onModify}>
              Modify
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="outline" onClick={onReject}>
              Reject
            </Button>
          )}
          {onApprove && (
            <Button size="sm" onClick={onApprove}>
              Approve
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getActionIcon(decision.decision_type)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {getActionTitle(decision.decision_type)}
              </CardTitle>
              <CardDescription>
                Suggested at {format(new Date(decision.suggested_at), 'PPp')}
              </CardDescription>
            </div>
          </div>
          <Badge className={getPriorityColor(decision.priority)}>
            {decision.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Confidence Score</span>
          </div>
          <div className={`px-2 py-1 rounded-md text-sm font-medium ${getConfidenceColor(decision.confidence_score)}`}>
            {Math.round(decision.confidence_score * 100)}%
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Action Details</h4>
          {renderActionParameters()}
        </div>

        {decision.status === 'pending' && decision.expires_at && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action will expire at {format(new Date(decision.expires_at), 'PPp')}
            </AlertDescription>
          </Alert>
        )}

        {(onApprove || onReject || onModify) && (
          <div className="flex gap-2 pt-2">
            {onModify && (
              <Button variant="outline" onClick={onModify} className="flex-1">
                Modify Parameters
              </Button>
            )}
            {onReject && (
              <Button variant="outline" onClick={onReject} className="flex-1">
                Reject
              </Button>
            )}
            {onApprove && (
              <Button onClick={onApprove} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Execute
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};