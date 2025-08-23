# Estate Hive CRM - Database Implementation Guide

## Overview
The database has been completely restructured with a clean, secure schema designed for MVP implementation.

## New Supabase Configuration
- **Project URL**: https://nepstrbszgqczpphhknv.supabase.co
- **Environment variables updated in `.env` file**

## Database Structure

### Authentication & Security
- **profiles**: User profiles with role-based access (admin, agent, user, owner, builder)
- **auth_otps**: OTP verification for phone numbers
- **email_verification_tokens**: Email verification system
- **oauth_connections**: LinkedIn/Google OAuth support
- **user_sessions**: Session management with expiry

### Core Business Tables
- **properties**: 50+ fields for comprehensive property management
- **agents**: Agent profiles with commission tracking
- **clients**: Customer relationship management
- **leads**: Lead pipeline with stages
- **appointments**: Scheduling system
- **invoices**: Billing with line items
- **conversations**: Multi-channel messaging
- **messages**: Communication history
- **notifications**: System alerts

### Security Features Implemented
1. **Row Level Security (RLS)**: Enabled on all tables
2. **Role-based access control**: Admin, Agent, User roles
3. **OTP verification**: For phone number authentication
4. **Email verification**: Token-based email confirmation
5. **OAuth ready**: LinkedIn integration configured
6. **Audit logging**: Track all sensitive operations
7. **Session management**: Secure token-based sessions

## How to Apply the Migration

### Option 1: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy contents of `supabase/migrations/001_complete_database_setup.sql`
5. Paste and run the migration

### Option 2: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref nepstrbszgqczpphhknv

# Run the migration
supabase db push
```

## Key Features

### Property Management
- Comprehensive property details (50+ fields)
- Image galleries and virtual tours
- RERA compliance fields
- SEO optimization with slugs
- Automatic calculations (price per sqft, age)

### Lead & Client Management
- Lead stages: new → contacted → qualified → proposal → negotiation → closed
- Client types: buyer, seller, tenant, landlord, investor
- Automated lead-to-client conversion tracking

### Communication Hub
- Multi-channel support (WhatsApp, Telegram, Email, SMS)
- Message status tracking
- Conversation threading
- Platform-specific IDs

### Financial Management
- Invoice generation with line items
- Automatic tax calculations (18% GST)
- Payment tracking
- Commission management

## Storage Buckets
- **property-images**: Public property photos
- **property-documents**: Private documents
- **agent-avatars**: Agent profile pictures
- **client-documents**: Client files

## Next Steps

1. **Run the migration** using one of the methods above
2. **Test the connection** in your application
3. **Create initial admin user**:
   ```sql
   -- This will be handled automatically when first user signs up
   -- First user can be given admin role
   ```

4. **Configure OAuth** (optional):
   - Set up LinkedIn OAuth in Supabase dashboard
   - Add redirect URLs
   - Update environment variables

## Security Notes
- All sensitive operations are logged in `audit_logs`
- RLS policies ensure users only see their own data
- Agents can only access assigned leads/clients
- Admins have full access to all data
- Public can only view active properties

## Troubleshooting

If you encounter issues:
1. Ensure Supabase project is active
2. Check environment variables are correctly set
3. Verify network connectivity
4. Review browser console for errors

## Support
For database-related queries, check:
- Supabase Dashboard → Logs
- Application error messages
- Browser DevTools → Network tab