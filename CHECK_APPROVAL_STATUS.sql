-- =====================================================
-- APPROVAL SYSTEM STATUS CHECK
-- Run this in Supabase SQL Editor to verify everything is working
-- =====================================================

-- 1. CHECK IF TABLES EXIST
SELECT 
    '✅ TABLES CHECK' as check_type,
    COUNT(*) as tables_found,
    CASE 
        WHEN COUNT(*) = 6 THEN '✅ All tables exist!'
        ELSE '❌ Missing tables - run RUN_APPROVAL_SYSTEM.sql first'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_roles',
    'user_role_assignments',
    'approval_requests',
    'approval_workflows',
    'auto_approval_rules',
    'crm_audit_trail'
);

-- 2. CHECK DEFAULT ROLES
SELECT 
    '✅ ROLES CHECK' as check_type,
    COUNT(*) as roles_count,
    string_agg(role_name, ', ') as role_names
FROM public.user_roles
WHERE is_system_role = true;

-- 3. CHECK WORKFLOWS
SELECT 
    '✅ WORKFLOWS CHECK' as check_type,
    COUNT(*) as workflow_count,
    string_agg(workflow_name, ', ') as workflow_names
FROM public.approval_workflows
WHERE is_active = true;

-- 4. CHECK AUTO-APPROVAL RULES
SELECT 
    '✅ AUTO-APPROVAL RULES' as check_type,
    COUNT(*) as rules_count,
    string_agg(rule_name, ', ') as rule_names
FROM public.auto_approval_rules
WHERE is_active = true;

-- 5. CHECK PENDING APPROVALS
SELECT 
    '📋 PENDING APPROVALS' as check_type,
    COUNT(*) as pending_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'You have pending approvals to review!'
        ELSE 'No pending approvals'
    END as message
FROM public.approval_requests
WHERE status = 'pending';

-- 6. CHECK RECENT AUDIT ENTRIES
SELECT 
    '📊 RECENT ACTIVITY' as check_type,
    COUNT(*) as audit_entries_last_24h,
    CASE 
        WHEN COUNT(*) > 0 THEN 'System is logging activities'
        ELSE 'No recent activity logged'
    END as status
FROM public.crm_audit_trail
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- 7. DETAILED PENDING APPROVALS (if any exist)
SELECT 
    '🔍 PENDING APPROVAL DETAILS' as section,
    id,
    entity_type,
    action_type,
    change_summary,
    requested_by,
    created_at::date as request_date,
    priority
FROM public.approval_requests
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- 8. YOUR USER ROLE (if assigned)
SELECT 
    '👤 YOUR ROLE' as section,
    r.role_name,
    r.role_code,
    r.approval_levels,
    r.can_auto_approve,
    CASE 
        WHEN r.can_auto_approve THEN 'You can auto-approve certain actions'
        ELSE 'Manual approval required'
    END as approval_capability
FROM public.user_roles r
WHERE r.organization_id = auth.uid()
LIMIT 1;

-- 9. SYSTEM HEALTH CHECK
SELECT 
    '🔧 SYSTEM HEALTH' as check_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.user_roles) > 0 
         AND (SELECT COUNT(*) FROM public.approval_workflows) > 0
         AND (SELECT COUNT(*) FROM public.auto_approval_rules) > 0
        THEN '✅ System is fully configured and ready!'
        ELSE '⚠️ System needs configuration'
    END as status,
    (SELECT COUNT(*) FROM public.user_roles) as total_roles,
    (SELECT COUNT(*) FROM public.approval_workflows) as total_workflows,
    (SELECT COUNT(*) FROM public.auto_approval_rules) as total_rules,
    (SELECT COUNT(*) FROM public.approval_requests) as total_requests,
    (SELECT COUNT(*) FROM public.crm_audit_trail) as total_audit_entries;