# 🔐 Security Setup Guide

This guide provides multiple options to completely secure your private key, from basic encryption to enterprise-grade solutions.

## 🎯 Quick Security Assessment

Run this to see your current security level:
```bash
npm run security-check
```

## 📊 Security Levels

| Level | Method | Security | Complexity | Best For |
|-------|---------|----------|------------|----------|
| 🔴 **LOW** | Plain Text | ❌ Insecure | ✅ Simple | Development only |
| 🟡 **MEDIUM** | Local Encryption | ✅ Good | ✅ Easy | Small projects |
| 🟢 **HIGH** | AWS KMS | ✅ Excellent | 🟡 Moderate | Cloud applications |
| 🔵 **ENTERPRISE** | Vault/MultiSig | ✅ Maximum | 🔴 Complex | Production systems |

---

## 🔧 Option 1: Local Encryption (MEDIUM Security)

**Best for**: Small projects, quick security upgrade

### Setup Steps:

1. **Generate encrypted key**:
```bash
node scripts/encrypt-private-key.js
```

2. **Update your .env**:
```bash
# Remove old key
# PRIVATE_KEY=abc123...

# Add encrypted key
ENCRYPTED_PRIVATE_KEY=salt:iv:authTag:encryptedData
ENCRYPTION_PASSWORD=your-secure-password-min-12-chars
```

3. **Test the setup**:
```bash
npm run dev
# Should show: "🔐 Security Level: MEDIUM"
```

### ✅ Benefits:
- Easy to implement
- No external dependencies
- Keys encrypted at rest

### ⚠️ Considerations:
- Password stored alongside encrypted key
- Single point of failure

---

## ☁️ Option 2: AWS KMS (HIGH Security)

**Best for**: Cloud-native applications, AWS infrastructure

### Setup Steps:

1. **Install AWS SDK**:
```bash
npm install @aws-sdk/client-kms
```

2. **Create KMS Key** in AWS Console:
   - Go to AWS KMS → Create key
   - Choose "Symmetric" → "Encrypt and decrypt"
   - Note the Key ID

3. **Set up IAM permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:region:account:key/key-id"
    }
  ]
}
```

4. **Encrypt your private key**:
```bash
node scripts/kms-encrypt-key.js
```

5. **Update environment variables**:
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
KMS_ENCRYPTED_PRIVATE_KEY=base64-encrypted-key
```

### ✅ Benefits:
- Hardware security modules
- Audit logging
- Fine-grained permissions
- Automatic key rotation

### ⚠️ Considerations:
- Requires AWS infrastructure
- Additional costs
- Network dependency

---

## 🏛️ Option 3: HashiCorp Vault (ENTERPRISE Security)

**Best for**: Enterprise environments, centralized secret management

### Setup Steps:

1. **Install Vault**:
```bash
# Download from https://www.vaultproject.io/downloads
# Or use Docker:
docker run --cap-add=IPC_LOCK -p 8200:8200 vault:latest
```

2. **Initialize Vault**:
```bash
export VAULT_ADDR='http://localhost:8200'
vault operator init
vault operator unseal [unseal-key-1]
vault operator unseal [unseal-key-2]
vault operator unseal [unseal-key-3]
```

3. **Configure secrets engine**:
```bash
vault auth -method=userpass username=admin password=your-password
vault secrets enable -path=secret kv-v2
```

4. **Store private key**:
```bash
node scripts/vault-store-key.js
```

5. **Update environment variables**:
```bash
VAULT_URL=http://localhost:8200
VAULT_TOKEN=your-vault-token
VAULT_KEY_PATH=secret/data/private-keys
```

### ✅ Benefits:
- Centralized secret management
- Audit logging
- Automatic rotation
- Fine-grained access control
- Multi-cloud support

### ⚠️ Considerations:
- Complex setup
- Requires infrastructure
- Operational overhead

---

## 🏦 Option 4: MultiSig Wallet (MAXIMUM Security)

**Best for**: High-value operations, distributed trust

### Setup Steps:

1. **Create Gnosis Safe**:
   - Go to https://gnosis-safe.io/
   - Create new Safe with 2-3 owners
   - Set threshold to 2 (requires 2 signatures)
   - Fund with wxHOPR tokens and xDai

2. **Configure server**:
```bash
MULTISIG_ADDRESS=0x1234567890123456789012345678901234567890
SERVER_PRIVATE_KEY=abc123...  # One of the Safe owners
MULTISIG_THRESHOLD=2
```

3. **Set up signing workflow**:
   - Server proposes transactions
   - Other owners sign via Safe interface
   - Server executes when threshold reached

### ✅ Benefits:
- No single point of failure
- Distributed trust
- Transparent operations
- Can revoke compromised keys

### ⚠️ Considerations:
- Requires coordination
- Slower transaction processing
- Complex key distribution

---

## 🚀 Implementation Steps

### 1. Choose Your Security Level
```bash
# Check current security
npm run security-check

# Choose based on your needs:
# - Development: Local Encryption
# - Production: AWS KMS or Vault
# - High-stakes: MultiSig
```

### 2. Implement Chosen Solution
Follow the specific setup steps above for your chosen security level.

### 3. Test the Implementation
```bash
# Start the service
npm run dev

# Should show your security level:
# 🔐 Security Level: HIGH
# 🛡️ Key Strategy: kms
```

### 4. Validate Security
```bash
# Run security validation
npm run validate-security

# Check that old keys are removed
grep -r "PRIVATE_KEY=" .env* || echo "✅ No plain text keys found"
```

---

## 🔍 Security Checklist

### Before Production:
- [ ] Private key is encrypted/secured
- [ ] No plain text keys in environment
- [ ] Security level is HIGH or ENTERPRISE
- [ ] Access logging is enabled
- [ ] Key rotation plan is in place
- [ ] Backup and recovery procedures tested

### Regular Maintenance:
- [ ] Monitor access logs
- [ ] Rotate keys quarterly
- [ ] Update security dependencies
- [ ] Review access permissions
- [ ] Test disaster recovery

---

## 🆘 Emergency Procedures

### If Private Key is Compromised:

1. **Immediate Actions**:
```bash
# Stop the service
docker-compose down

# Generate new private key
node scripts/generate-new-key.js

# Transfer remaining funds to new address
```

2. **Recovery Steps**:
   - Update key in chosen security system
   - Restart service with new key
   - Monitor for unauthorized transactions
   - Update documentation

### If Security System is Down:
- Have backup key management ready
- Implement circuit breaker pattern
- Set up monitoring alerts
- Document rollback procedures

---

## 📞 Support

For security questions or issues:
1. Check the logs: `docker-compose logs`
2. Run diagnostics: `npm run security-check`
3. Review this guide
4. Consult your security team

**Remember**: Security is not a one-time setup. Regular reviews and updates are essential!
