# Estate Hive CRM - Complete Database Setup Guide

## Overview
This guide will help you completely reset and set up a professional-grade database schema for Estate Hive CRM with comprehensive security and proper structure.

## ⚠️ WARNING
**This will DELETE ALL existing data in your database!** Make sure to backup any important data before proceeding.

## Prerequisites
- Access to Supabase Dashboard
- Admin privileges on the project
- Project URL: `https://mtjxfyzcuuvtplemliwe.supabase.co`

## Step-by-Step Setup

### 1. Backup Existing Data (If Needed)
If you have important data, export it first:
1. Go to Supabase Dashboard → SQL Editor
2. Run export queries for tables you want to keep
3. Save the results

### 2. Run the Complete Database Reset

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/mtjxfyzcuuvtplemliwe/sql
   
2. **Copy the Migration Script**
   - Open `supabase/migrations/COMPLETE_DATABASE_RESET.sql`
   - Copy the ENTIRE content

3. **Execute the Migration**
   - Paste the script into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for completion (may take 1-2 minutes)

4. **Verify Success**
   - You should see: "Database setup complete!"
   - Check the notice for table and policy counts

### 3. Create Admin User

After the database is set up, create an admin user:

```sql
-- First, create a user via Supabase Auth
-- Then run this to make them admin:

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@estatehive.com';
```

Or use the provided script:
```bash
node create-test-user.js
```

### 4. Verify Tables Created

Run this query to verify all tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- agents
- appointments
- clients
- conversations
- invoices
- leads
- messages
- notifications
- profiles
- properties

### 5. Verify RLS Policies

Check that Row Level Security is enabled:

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### 6. Test Authentication

1. Try logging in with your admin user
2. Verify you can access the application
3. Check that data operations work correctly

## Database Features

### Security Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access control (admin, agent, user)
- ✅ Secure password policies
- ✅ Data validation constraints
- ✅ SQL injection protection

### Data Integrity
- ✅ Foreign key constraints
- ✅ Check constraints for data validation
- ✅ Unique constraints where needed
- ✅ Default values for required fields
- ✅ Automatic timestamp updates

### Performance Optimizations
- ✅ Indexes on frequently queried columns
- ✅ Composite indexes for complex queries
- ✅ Partial indexes for filtered queries
- ✅ Generated columns for computed values

### Messaging Platform Support
- ✅ WhatsApp integration
- ✅ Telegram integration
- ✅ SMS support (ready)
- ✅ Email support (ready)

## Table Structure

### Core Tables
1. **profiles** - User profiles with roles
2. **agents** - Real estate agents
3. **properties** - Property listings
4. **leads** - Sales leads
5. **clients** - Customer records

### Communication
6. **conversations** - Multi-platform messaging
7. **messages** - Message history
8. **notifications** - System notifications

### Business
9. **appointments** - Scheduling
10. **invoices** - Billing

## User Roles

### Admin
- Full access to all data
- Can manage users and agents
- System configuration

### Agent
- Manage own properties
- View and manage assigned leads
- Handle client communications

### User
- View properties
- Manage own profile
- Basic interactions

## Testing the Setup

### 1. Test User Creation
```sql
-- Check if trigger creates profile
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
```

### 2. Test RLS Policies
```sql
-- Should only show data for authenticated user
SELECT * FROM conversations;
SELECT * FROM messages;
```

### 3. Test Messaging
- Create a test conversation
- Send test messages
- Verify platform support

## Troubleshooting

### If migration fails:
1. Check for syntax errors in the console
2. Run sections of the script separately
3. Verify Supabase service is running

### If RLS blocks access:
1. Check user role in profiles table
2. Verify authentication token
3. Review policy conditions

### If tables are missing:
1. Re-run the migration script
2. Check for errors in the output
3. Verify database permissions

## Next Steps

1. **Deploy Edge Functions**
   - telegram-webhook
   - send-telegram-message

2. **Configure Telegram Bot**
   ```bash
   setup-telegram.bat
   ```

3. **Set Environment Variables**
   - Ensure .env file is configured
   - Add any missing API keys

4. **Test the Application**
   - Login with admin account
   - Create test data
   - Verify all features work

## Maintenance

### Regular Tasks
- Monitor table sizes
- Update statistics: `ANALYZE;`
- Check slow queries
- Review security logs

### Backup Strategy
- Enable Point-in-Time Recovery
- Schedule regular backups
- Test restore procedures

## Support

For issues:
1. Check Supabase logs
2. Review RLS policies
3. Verify user permissions
4. Check application logs

## Security Best Practices

1. **Never disable RLS** on production tables
2. **Use prepared statements** in application code
3. **Rotate API keys** regularly
4. **Monitor failed login attempts**
5. **Audit data access** patterns

## Performance Tips

1. Use indexes wisely
2. Paginate large result sets
3. Cache frequently accessed data
4. Use database views for complex queries
5. Monitor query performance

---

**Important**: This is a production-ready schema. Always test changes in a development environment first!