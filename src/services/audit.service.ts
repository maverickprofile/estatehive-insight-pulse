import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  CRMAuditTrail,
  AuditFilter,
  AuditReport,
  ApprovalStatistics,
  AuditTimelineEntry,
  EntityType,
  Operation,
} from '@/types/approval.types';

class AuditService {
  /**
   * Log an audit trail entry
   */
  async logAuditTrail(entry: Omit<CRMAuditTrail, 'id' | 'created_at' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: CRMAuditTrail = {
        ...entry,
        id: uuidv4(),
        timestamp: new Date(),
        created_at: new Date(),
      };

      // Determine data classification based on entity type
      if (!auditEntry.data_classification) {
        auditEntry.data_classification = this.getDataClassification(entry.entity_type);
      }

      // Set default retention days if not specified
      if (!auditEntry.retention_days) {
        auditEntry.retention_days = this.getRetentionDays(auditEntry.data_classification);
      }

      // Get user details if not provided
      if (entry.user_id && !entry.user_name) {
        const userDetails = await this.getUserDetails(entry.user_id);
        if (userDetails) {
          auditEntry.user_name = userDetails.name;
          auditEntry.user_role = userDetails.role;
        }
      }

      // Get session information from browser
      auditEntry.session_id = this.getSessionId();
      auditEntry.ip_address = await this.getClientIP();
      auditEntry.user_agent = navigator.userAgent;

      // Save to database
      const { error } = await supabase
        .from('crm_audit_trail')
        .insert({
          ...auditEntry,
          timestamp: auditEntry.timestamp.toISOString(),
          created_at: auditEntry.created_at.toISOString(),
        });

      if (error) {
        console.error('Error logging audit trail:', error);
      }
    } catch (error) {
      console.error('Failed to log audit trail:', error);
    }
  }

  /**
   * Log approval action
   */
  async logApprovalAction(
    requestId: string,
    userId: string,
    action: string,
    entityType: EntityType,
    entityId?: string,
    notes?: string
  ): Promise<void> {
    await this.logAuditTrail({
      organization_id: userId,
      action_type: `approval_${action}`,
      action_category: 'approval',
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      operation: action === 'approve' ? 'approve' : 'reject',
      approval_request_id: requestId,
      approval_notes: notes,
      success: true,
    });
  }

  /**
   * Log data change
   */
  async logDataChange(
    userId: string,
    entityType: EntityType,
    entityId: string,
    operation: Operation,
    beforeData?: Record<string, any>,
    afterData?: Record<string, any>,
    approvalRequestId?: string
  ): Promise<void> {
    // Calculate changed fields
    const changedFields = this.getChangedFields(beforeData, afterData);

    await this.logAuditTrail({
      organization_id: userId,
      action_type: `${entityType}_${operation}`,
      action_category: 'data_change',
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      operation,
      before_data: beforeData,
      after_data: afterData,
      changed_fields: changedFields,
      approval_request_id: approvalRequestId,
      success: true,
    });
  }

  /**
   * Log system action
   */
  async logSystemAction(
    action: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAuditTrail({
      organization_id: 'system',
      action_type: action,
      action_category: 'system',
      entity_type: 'client',
      user_id: 'system',
      user_name: 'System',
      operation: 'read',
      success,
      error_message: errorMessage,
      after_data: metadata,
    });
  }

  /**
   * Get audit trail for an entity
   */
  async getEntityAuditTrail(
    entityType: EntityType,
    entityId: string,
    limit: number = 50
  ): Promise<CRMAuditTrail[]> {
    try {
      const { data, error } = await supabase
        .from('crm_audit_trail')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit trail:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit report
   */
  async getAuditReport(filter: AuditFilter): Promise<AuditReport> {
    try {
      let query = supabase.from('crm_audit_trail').select('*');

      // Apply filters
      if (filter.organization_id) {
        query = query.eq('organization_id', filter.organization_id);
      }
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.entity_type) {
        query = query.eq('entity_type', filter.entity_type);
      }
      if (filter.entity_id) {
        query = query.eq('entity_id', filter.entity_id);
      }
      if (filter.action_type) {
        query = query.eq('action_type', filter.action_type);
      }
      if (filter.success !== undefined) {
        query = query.eq('success', filter.success);
      }
      if (filter.date_from) {
        query = query.gte('timestamp', filter.date_from.toISOString());
      }
      if (filter.date_to) {
        query = query.lte('timestamp', filter.date_to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error generating audit report:', error);
        return this.getEmptyReport();
      }

      return this.processAuditData(data || []);
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      return this.getEmptyReport();
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStatistics(
    organizationId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ApprovalStatistics> {
    try {
      let query = supabase
        .from('approval_requests')
        .select('*')
        .eq('organization_id', organizationId);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching approval statistics:', error);
        return this.getEmptyStatistics();
      }

      const requests = data || [];
      const approved = requests.filter(r => r.status === 'approved').length;
      const rejected = requests.filter(r => r.status === 'rejected').length;
      const expired = requests.filter(r => r.status === 'expired').length;
      const autoApproved = requests.filter(r => r.status === 'auto_approved').length;

      // Calculate average approval time
      const approvedRequests = requests.filter(r => r.status === 'approved' && r.approved_at);
      let avgApprovalTime = 0;
      if (approvedRequests.length > 0) {
        const totalTime = approvedRequests.reduce((sum, req) => {
          const requestTime = new Date(req.requested_at).getTime();
          const approvalTime = new Date(req.approved_at).getTime();
          return sum + (approvalTime - requestTime);
        }, 0);
        avgApprovalTime = totalTime / approvedRequests.length / 1000; // Convert to seconds
      }

      return {
        total_requests: requests.length,
        approved,
        rejected,
        expired,
        auto_approved: autoApproved,
        average_approval_time: avgApprovalTime,
        approval_rate: requests.length > 0 ? (approved / requests.length) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to get approval statistics:', error);
      return this.getEmptyStatistics();
    }
  }

  /**
   * Clean up old audit entries based on retention policy
   */
  async cleanupOldAuditEntries(): Promise<number> {
    try {
      // Calculate cutoff dates for each classification
      const now = new Date();
      const cutoffs = {
        public: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days
        internal: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days
        confidential: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year
        restricted: new Date(now.getTime() - 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      };

      let totalDeleted = 0;

      for (const [classification, cutoffDate] of Object.entries(cutoffs)) {
        const { data, error } = await supabase
          .from('crm_audit_trail')
          .delete()
          .eq('data_classification', classification)
          .lt('timestamp', cutoffDate.toISOString())
          .select('id');

        if (!error && data) {
          totalDeleted += data.length;
        }
      }

      console.log(`Cleaned up ${totalDeleted} old audit entries`);
      return totalDeleted;
    } catch (error) {
      console.error('Failed to cleanup audit entries:', error);
      return 0;
    }
  }

  /**
   * Helper methods
   */
  private getDataClassification(entityType: EntityType): 'public' | 'internal' | 'confidential' | 'restricted' {
    const classifications: Record<EntityType, 'public' | 'internal' | 'confidential' | 'restricted'> = {
      property: 'public',
      appointment: 'internal',
      task: 'internal',
      communication: 'internal',
      lead: 'confidential',
      client: 'confidential',
      invoice: 'restricted',
    };
    return classifications[entityType] || 'internal';
  }

  private getRetentionDays(classification: 'public' | 'internal' | 'confidential' | 'restricted'): number {
    const retentionMap = {
      public: 30,
      internal: 90,
      confidential: 365,
      restricted: 2555, // 7 years
    };
    return retentionMap[classification];
  }

  private async getUserDetails(userId: string): Promise<{ name: string; role: string } | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles_assignments')
        .select('*, user_roles(*)')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        name: userId, // Would need actual user table for name
        role: data.user_roles?.role_name || 'Unknown',
      };
    } catch {
      return null;
    }
  }

  private getSessionId(): string {
    // Get or create session ID from sessionStorage
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private getChangedFields(
    beforeData?: Record<string, any>,
    afterData?: Record<string, any>
  ): string[] {
    if (!beforeData || !afterData) return [];

    const changedFields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(beforeData),
      ...Object.keys(afterData),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  private processAuditData(data: any[]): AuditReport {
    const actionsByType: Record<string, number> = {};
    const actionsByUser: Record<string, number> = {};
    const timeline: AuditTimelineEntry[] = [];

    for (const entry of data) {
      // Count by action type
      if (entry.action_type) {
        actionsByType[entry.action_type] = (actionsByType[entry.action_type] || 0) + 1;
      }

      // Count by user
      if (entry.user_name) {
        actionsByUser[entry.user_name] = (actionsByUser[entry.user_name] || 0) + 1;
      }

      // Add to timeline
      timeline.push({
        timestamp: new Date(entry.timestamp),
        user: entry.user_name || entry.user_id,
        action: entry.action_type,
        entity: `${entry.entity_type}${entry.entity_id ? ` #${entry.entity_id}` : ''}`,
        result: entry.success ? 'success' : 'failure',
        details: entry.error_message,
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      total_actions: data.length,
      actions_by_type: actionsByType,
      actions_by_user: actionsByUser,
      approval_stats: this.getEmptyStatistics(),
      timeline: timeline.slice(0, 100), // Limit to 100 most recent
    };
  }

  private getEmptyReport(): AuditReport {
    return {
      total_actions: 0,
      actions_by_type: {},
      actions_by_user: {},
      approval_stats: this.getEmptyStatistics(),
      timeline: [],
    };
  }

  private getEmptyStatistics(): ApprovalStatistics {
    return {
      total_requests: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      auto_approved: 0,
      average_approval_time: 0,
      approval_rate: 0,
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();