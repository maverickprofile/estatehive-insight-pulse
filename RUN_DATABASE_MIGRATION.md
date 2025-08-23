# Database Migration Instructions

## ⚠️ IMPORTANT: Run in Order!

Due to existing functions in your database, you need to run the migration in two steps:

## Step 1: Clean Up Existing Database Objects

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/mtjxfyzcuuvtplemliwe/sql

2. **Copy and run** the entire content of:
   ```
   supabase/migrations/0_CLEANUP_FIRST.sql
   ```

3. Wait for it to complete. You'll see:
   ```
   CLEANUP COMPLETE!
   You can now run the main migration.
   ```

## Step 2: Run the Main Migration

1. In the same SQL Editor, **clear the previous query**

2. **Copy and run** the entire content of:
   ```
   supabase/migrations/COMPLETE_DATABASE_RESET.sql
   ```

3. Wait for completion. You should see:
   ```
   Database setup complete!
   Tables created: [number]
   RLS policies created: [number]
   ```

## Step 3: Create Your Admin User

After the database is set up:

### Option A: Using the Script
```bash
node create-test-user.js
```
Choose option 2 for quick test user.

### Option B: Manual SQL
```sql
-- First create a user through Supabase Auth
-- Then make them admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'test@estatehive.com';
```

## Step 4: Verify Everything Works

1. **Check tables were created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

2. **Check RLS policies:**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

3. **Test login:**
- Email: `test@estatehive.com`
- Password: `test123456`

## Troubleshooting

### If you get function errors:
- Make sure you ran `0_CLEANUP_FIRST.sql` first
- The cleanup script removes ALL functions to avoid conflicts

### If tables already exist:
- The migration uses `DROP TABLE IF EXISTS CASCADE`
- This is safe and will recreate everything fresh

### If authentication fails:
- Verify the user was created in Auth
- Check the user has a profile record
- Ensure the role is set correctly

## What This Migration Does

✅ **Removes** all existing database objects safely
✅ **Creates** professional table structure
✅ **Implements** comprehensive RLS security
✅ **Adds** all necessary indexes
✅ **Sets up** multi-platform messaging support
✅ **Configures** proper constraints and validation

## Important Notes

1. **This DELETES all data** - backup first if needed
2. **Run in order** - cleanup first, then main migration
3. **Create admin user** - required for full functionality
4. **Test thoroughly** - verify all features work

## Success Checklist

- [ ] Cleanup script ran successfully
- [ ] Main migration completed without errors
- [ ] Admin user created
- [ ] Can login to application
- [ ] Tables visible in Supabase
- [ ] RLS policies active
- [ ] Messaging features work

## Need Help?

1. Check the SQL output for specific errors
2. Verify you're running scripts in order
3. Ensure you have admin privileges in Supabase
4. Check Supabase service status

---

**Remember**: Always run `0_CLEANUP_FIRST.sql` before `COMPLETE_DATABASE_RESET.sql`!