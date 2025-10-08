# 🔐 Security Guide

This guide covers security configuration, best practices, and advanced security features for the CFP Funding Tool.

## 🔑 Private Key Management

### Encrypted Private Keys (Recommended)

The system uses **AES-256-CBC encryption with PBKDF2** key derivation (100,000 iterations, SHA-256) for secure private key storage.

#### Quick Setup

```bash
# Option A: Quick encryption tool (recommended)
npm run quick-encrypt

# Option B: Standard encryption tool
npm run encrypt-key
```

#### Step-by-Step Process

1. **Run the encryption tool:**
   ```bash
   npm run quick-encrypt
   ```

2. **Enter your private key** (without 0x prefix):
   ```
   Enter your private key (without 0x prefix): abcd1234...your64hexchars
   ```

3. **Enter a strong password** (minimum 12 characters):
   ```
   Enter encryption password (min 12 characters): YourSecurePassword123!
   ```

4. **Copy the output to your .env file:**
   ```env
   ENCRYPTED_PRIVATE_KEY=a1b2c3d4...salt:iv:encrypted_data_in_hex
   ENCRYPTION_PASSWORD=YourSecurePassword123!
   ```

5. **Comment out the plain text key:**
   ```env
   # PRIVATE_KEY=your_private_key_here  # Remove or comment this line
   ```

#### Technical Details

- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with 100,000 iterations using SHA-256
- **Format**: `salt:iv:encrypted_data` (all hex-encoded)
- **Salt**: 32 random bytes for unique encryption each time
- **IV**: 16 random bytes for cipher initialization

### Plain Text Keys (Development Only)

- Never use plain text keys in production
- Only acceptable for local development
- Always use environment variables, never commit to version control
- Rotate keys regularly

## 🛡️ Application Security Features

### Input Validation & Sanitization

The application implements comprehensive input validation:

- **Multi-layer validation**: Joi schemas + security pattern detection
- **XSS Protection**: Script tags, event handlers blocked
- **SQL Injection Prevention**: Database query patterns blocked
- **Command Injection Prevention**: Shell commands blocked
- **50+ malicious patterns** detected and blocked automatically

### Security Patterns Detected

The security middleware automatically blocks:

```typescript
// XSS Patterns
'<script', 'javascript:', 'onload=', 'onerror=', 'onclick='

// SQL Injection Patterns
'UNION SELECT', 'DROP TABLE', 'INSERT INTO', '--', ';--'

// Command Injection Patterns
'$(', '`', '&&', '||', ';rm ', ';cat '

// Path Traversal
'../', '..\\', '/etc/passwd', '/proc/self'

// And many more...
```

### Rate Limiting

Built-in rate limiting protects against abuse:

- **Per IP limits**: Configurable requests per time window
- **Endpoint-specific limits**: Different limits for different endpoints
- **Automatic blocking**: Temporary IP blocks for repeated violations
- **Security logging**: All rate limit events are logged

### Network Security

- **CSP Headers**: Content Security Policy protection
- **CORS Configuration**: Restricted origins for production
- **HTTPS Enforcement**: Automatic HTTPS redirect in production
- **Security Headers**: Comprehensive security header configuration

## 🐳 Container Security

### Production Hardening

The production Docker configuration implements:

```dockerfile
# Read-only filesystem
--read-only

# Minimal capabilities
--cap-drop=ALL

# Resource limits
--memory=512m --cpus="0.5"

# Network isolation
--network=bridge --publish=127.0.0.1:3000:3000

# Non-root user
USER node
```

### Security Scanning

Regular security scanning is recommended:

```bash
# Docker security scan
./scripts/docker-security-scan.sh

# Dependency vulnerability scan
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

## 🔍 Security Monitoring

### Log Analysis

Security events are logged to dedicated files:

- **Security Logs**: `logs/security-*.log`
- **Failed Authentication**: Login/validation failures
- **Blocked Attacks**: Malicious pattern detections
- **Rate Limit Violations**: Excessive request patterns

### Real-time Monitoring

Monitor security events in real-time:

```bash
# Watch security logs
tail -f logs/security-$(date +%Y-%m-%d).log

# Filter for specific threats
grep -i "blocked\|attack\|violation" logs/security-*.log

# Monitor rate limiting
grep -i "rate.*limit" logs/combined-*.log
```

### Security Metrics

Key security metrics to monitor:

- Number of blocked requests per hour
- Failed authentication attempts
- Rate limit violations by IP
- Unusual traffic patterns
- Error rates and response times

## 🚨 Incident Response

### Security Event Types

1. **High Priority**
   - Multiple failed authentication attempts
   - SQL injection attempts
   - Command injection attempts
   - Unusual traffic spikes

2. **Medium Priority**
   - XSS attempts
   - Path traversal attempts
   - Rate limit violations

3. **Low Priority**
   - Invalid input formats
   - CORS violations
   - General validation failures

### Response Procedures

1. **Immediate Response**
   ```bash
   # Check current security status
   curl http://localhost:3000/api/airdrop/health
   
   # Review recent security logs
   tail -100 logs/security-$(date +%Y-%m-%d).log
   
   # Check for active attacks
   grep -c "blocked" logs/security-$(date +%Y-%m-%d).log
   ```

2. **Investigation**
   ```bash
   # Analyze attack patterns
   grep "SECURITY_VIOLATION" logs/security-*.log | cut -d'"' -f4 | sort | uniq -c
   
   # Check source IPs
   grep "blocked" logs/security-*.log | grep -o '"ip":"[^"]*"' | sort | uniq -c
   
   # Review timeline
   grep "blocked" logs/security-*.log | head -20
   ```

3. **Mitigation**
   - Update rate limiting rules if needed
   - Block malicious IPs at firewall level
   - Review and update security patterns
   - Consider temporary service restrictions

## 🔧 Security Configuration

### Environment Variables

Security-related environment variables:

```env
# Private Key Security
ENCRYPTED_PRIVATE_KEY=your_encrypted_key
ENCRYPTION_PASSWORD=your_strong_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window
RATE_LIMIT_SKIP_SUCCESS=false        # Count successful requests

# Security Headers
SECURITY_HEADERS_ENABLED=true
CSP_POLICY=default-src 'self'
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_SECURITY_EVENTS=true
LOG_LEVEL=info
```

### Advanced Configuration

For enterprise deployments:

```env
# Hardware Security Modules
USE_AWS_KMS=false
AWS_KMS_KEY_ID=your_kms_key_id
AWS_REGION=us-east-1

# HashiCorp Vault
USE_VAULT=false
VAULT_ENDPOINT=https://vault.your-company.com
VAULT_TOKEN=your_vault_token
VAULT_SECRET_PATH=secret/cfp-funding-tool
```

## 🧪 Security Testing

### Automated Security Tests

Run security tests regularly:

```bash
# Run security test suite
npm run test:security

# Test input validation
npm run test:validation

# Test rate limiting
npm run test:rate-limiting
```

### Manual Security Testing

Test security features manually:

```bash
# Test XSS protection
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{"secretCode":"<script>alert(1)</script>","recipientAddress":"0x123"}'

# Test SQL injection protection
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{"secretCode":"test; DROP TABLE users;--","recipientAddress":"0x123"}'

# Test rate limiting
for i in {1..20}; do
  curl http://localhost:3000/api/airdrop/status
done
```

### Penetration Testing

For production deployments, consider:

- Regular penetration testing by security professionals
- Automated vulnerability scanning
- Code security audits
- Dependency security analysis

## 📋 Security Checklist

### Pre-Deployment

- [ ] Private keys are encrypted
- [ ] Strong encryption passwords are used
- [ ] No secrets in version control
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] SSL/TLS is enabled
- [ ] Security logging is active

### Post-Deployment

- [ ] Monitor security logs regularly
- [ ] Set up alerting for security events
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate encryption passwords quarterly
- [ ] Conduct security reviews annually

### Emergency Procedures

- [ ] Document incident response procedures
- [ ] Test backup and recovery processes
- [ ] Maintain emergency contact list
- [ ] Have rollback procedures ready
- [ ] Keep security team contact information current

## 🆘 Troubleshooting

### Common Security Issues

**"Decryption failed" error:**
- Verify encryption password is correct
- Check encrypted key format
- Ensure no extra whitespace in environment variables

**Rate limiting too aggressive:**
- Adjust `RATE_LIMIT_MAX_REQUESTS` value
- Increase `RATE_LIMIT_WINDOW_MS` duration
- Review legitimate usage patterns

**CORS errors:**
- Verify `CORS_ORIGIN` matches frontend domain
- Check for protocol mismatches (http vs https)
- Ensure proper header configuration

### Debug Commands

```bash
# Validate encryption setup
npm run key-helper validate

# Test decryption
npm run key-helper decrypt

# Check security configuration
node -e "console.log(require('./dist/config').config)"

# Analyze security logs
grep -E "(SECURITY|BLOCKED|VIOLATION)" logs/security-*.log | tail -20
```

---

**Security is an ongoing process.** Regularly review and update your security configuration, monitor logs for threats, and stay informed about new security best practices.
