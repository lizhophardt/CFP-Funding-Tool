# 🗄️ Database Migration Guide

This guide covers migrating from the file-based secret code storage to PostgreSQL database storage.

## 🎯 Migration Overview

**What's Changed:**
- ✅ Secret codes now stored in PostgreSQL database
- ✅ Usage tracking with full audit trail
- ✅ Prevents code reuse and tracks recipient addresses
- ✅ Scalable and production-ready
- ❌ File-based `processed-codes.json` is no longer used

## 🔄 Migration Steps

### 1. Backup Current Data

Before migrating, backup your existing processed codes:

```bash
# Backup processed codes file (if it exists)
cp data/processed-codes.json data/processed-codes.backup.json

# Note current SECRET_CODES from environment
echo $SECRET_CODES > secret-codes.backup.txt
```

### 2. Set Up Database

**Local Development:**
```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# Or install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
```

**Production (Railway):**
1. Add PostgreSQL service to your Railway project
2. Copy the `DATABASE_URL` from Railway dashboard
3. Set `DATABASE_URL` environment variable

### 3. Run Database Migrations

The application automatically runs migrations on startup, but you can run them manually:

```bash
# Using the migration script
node scripts/migrate-secret-codes.js

# Or connect to database directly
psql $DATABASE_URL -f database/schema.sql
```

### 4. Migrate Secret Codes

**Option A: Automatic Migration (Recommended)**

Set the `SECRET_CODES` environment variable with your existing codes:
```bash
export SECRET_CODES="Code1,Code2,Code3"
npm start
# Codes will be automatically migrated to database on first startup
```

**Option B: Manual Migration**

```bash
# Run the migration script
node scripts/migrate-secret-codes.js

# Or add codes manually via database
psql $DATABASE_URL -c "
INSERT INTO secret_codes (code, description, max_uses) 
VALUES 
  ('Code1', 'Migrated from environment', 1),
  ('Code2', 'Migrated from environment', 1),
  ('Code3', 'Migrated from environment', 1);
"
```

### 5. Verify Migration

Check that codes were migrated successfully:

```bash
# Check database contents
psql $DATABASE_URL -c "SELECT * FROM secret_codes;"

# Test API health check
curl http://localhost:3000/api/airdrop/health

# Test service status
curl http://localhost:3000/api/airdrop/status
```

## 🔍 Database Schema

### Tables Created

**secret_codes**
- `id` - UUID primary key
- `code` - Unique secret code string
- `description` - Optional description
- `is_active` - Whether code can be used
- `max_uses` - Maximum uses (null = unlimited)
- `current_uses` - Current usage count
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - Who created the code

**code_usage**
- `id` - UUID primary key
- `code_id` - Foreign key to secret_codes
- `recipient_address` - Ethereum address
- `wxhopr_transaction_hash` - Transaction hash
- `xdai_transaction_hash` - Transaction hash
- `wxhopr_amount_wei` - Amount sent
- `xdai_amount_wei` - Amount sent
- `ip_address` - Client IP
- `user_agent` - Client user agent
- `used_at` - Usage timestamp
- `status` - completed/failed/pending
- `error_message` - Error details if failed
- `metadata` - Additional JSON data

## 🛠️ Managing Secret Codes

### View Active Codes

```bash
# Via database
psql $DATABASE_URL -c "SELECT * FROM active_codes_with_stats;"

# Via API (development only)
curl http://localhost:3000/api/airdrop/codes
```

### Add New Codes

```bash
# Via database
psql $DATABASE_URL -c "
INSERT INTO secret_codes (code, description, max_uses) 
VALUES ('NewCode123', 'Added manually', 1);
"

# Via API (if admin endpoints are enabled)
curl -X POST http://localhost:3000/api/admin/codes \
  -H 'Content-Type: application/json' \
  -d '{"code": "NewCode123", "description": "Added via API", "maxUses": 1}'
```

### Deactivate Codes

```bash
# Via database
psql $DATABASE_URL -c "
UPDATE secret_codes 
SET is_active = false 
WHERE code = 'OldCode123';
"
```

### View Usage History

```bash
# All usage
psql $DATABASE_URL -c "
SELECT sc.code, cu.recipient_address, cu.used_at, cu.status 
FROM code_usage cu 
JOIN secret_codes sc ON cu.code_id = sc.id 
ORDER BY cu.used_at DESC;
"

# Failed attempts
psql $DATABASE_URL -c "
SELECT * FROM code_usage 
WHERE status = 'failed' 
ORDER BY used_at DESC;
"
```

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check environment variables
echo $DATABASE_URL
echo $DB_HOST $DB_PORT $DB_NAME $DB_USER
```

### Migration Failed

```bash
# Reset database (WARNING: This deletes all data)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
psql $DATABASE_URL -f database/schema.sql
node scripts/migrate-secret-codes.js
```

### Code Not Found

```bash
# Check if code exists in database
psql $DATABASE_URL -c "SELECT * FROM secret_codes WHERE code = 'YourCode';"

# Check if code is active
psql $DATABASE_URL -c "SELECT * FROM secret_codes WHERE code = 'YourCode' AND is_active = true;"
```

### Usage Limit Exceeded

```bash
# Check usage count
psql $DATABASE_URL -c "
SELECT code, current_uses, max_uses, (max_uses - current_uses) as remaining 
FROM secret_codes 
WHERE code = 'YourCode';
"

# Reset usage count (if needed)
psql $DATABASE_URL -c "UPDATE secret_codes SET current_uses = 0 WHERE code = 'YourCode';"
```

## 🔄 Rollback Plan

If you need to rollback to the file-based system:

### 1. Export Current Database State

```bash
# Export all used codes
psql $DATABASE_URL -c "
COPY (
  SELECT DISTINCT sc.code 
  FROM secret_codes sc 
  JOIN code_usage cu ON sc.id = cu.code_id 
  WHERE cu.status = 'completed'
) TO '/tmp/used_codes.csv' WITH CSV;
"
```

### 2. Restore File-Based System

```bash
# Checkout previous version
git checkout v2.0.0  # or your last file-based version

# Restore processed codes file
cp data/processed-codes.backup.json data/processed-codes.json

# Update environment variables
export SECRET_CODES="Code1,Code2,Code3"
unset DATABASE_URL
```

## 📊 Performance Considerations

### Database Indexing

The schema includes optimized indexes:
- `secret_codes.code` (unique)
- `code_usage.recipient_address`
- `code_usage.used_at`
- `code_usage.status`

### Connection Pooling

The application uses connection pooling:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

### Monitoring

Monitor database performance:
```bash
# Connection stats
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Table sizes
psql $DATABASE_URL -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename IN ('secret_codes', 'code_usage');
"
```

## 🎉 Benefits of Database Storage

✅ **Persistent State**: No data loss on restart  
✅ **Audit Trail**: Complete usage history  
✅ **Scalability**: Handles thousands of codes/users  
✅ **Concurrency**: Thread-safe operations  
✅ **Analytics**: Rich querying capabilities  
✅ **Backup**: Standard database backup tools  
✅ **Security**: Encrypted connections, access control  

---

For deployment-specific instructions, see:
- [Railway Deployment](deployment/railway.md)
- [Docker Deployment](DEPLOYMENT.md)
- [Local Development](../README.md#development)
