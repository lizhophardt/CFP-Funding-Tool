-- CFP Funding Tool Database Schema
-- PostgreSQL database schema for secret codes and usage tracking

-- Create database (run manually if needed)
-- CREATE DATABASE cfp_funding_tool;

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Secret codes table
CREATE TABLE IF NOT EXISTS secret_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER DEFAULT 1, -- Allow configurable uses per code
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS code_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_id UUID NOT NULL REFERENCES secret_codes(id) ON DELETE CASCADE,
    recipient_address VARCHAR(42) NOT NULL, -- Ethereum address format
    wxhopr_transaction_hash VARCHAR(66), -- Ethereum transaction hash
    xdai_transaction_hash VARCHAR(66), -- Ethereum transaction hash
    wxhopr_amount_wei VARCHAR(78), -- Large number as string to avoid precision issues
    xdai_amount_wei VARCHAR(78), -- Large number as string to avoid precision issues
    ip_address INET,
    user_agent TEXT,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed', -- completed, failed, pending
    error_message TEXT,
    metadata JSONB DEFAULT '{}' -- Additional data for debugging/analytics
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_secret_codes_code ON secret_codes(code);
CREATE INDEX IF NOT EXISTS idx_secret_codes_active ON secret_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_code_usage_code_id ON code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_code_usage_recipient ON code_usage(recipient_address);
CREATE INDEX IF NOT EXISTS idx_code_usage_used_at ON code_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_code_usage_status ON code_usage(status);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_secret_codes_updated_at 
    BEFORE UPDATE ON secret_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage count when code is used
CREATE OR REPLACE FUNCTION increment_code_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment on successful usage
    IF NEW.status = 'completed' THEN
        UPDATE secret_codes 
        SET current_uses = current_uses + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.code_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically increment usage count
CREATE TRIGGER increment_secret_code_usage 
    AFTER INSERT ON code_usage 
    FOR EACH ROW EXECUTE FUNCTION increment_code_usage();

-- View for active codes with usage stats
CREATE OR REPLACE VIEW active_codes_with_stats AS
SELECT 
    sc.id,
    sc.code,
    sc.description,
    sc.max_uses,
    sc.current_uses,
    (sc.max_uses - sc.current_uses) AS remaining_uses,
    CASE 
        WHEN sc.max_uses IS NULL THEN true
        WHEN sc.current_uses < sc.max_uses THEN true
        ELSE false
    END AS can_be_used,
    sc.created_at,
    sc.updated_at,
    COUNT(cu.id) AS total_usage_records,
    COUNT(CASE WHEN cu.status = 'completed' THEN 1 END) AS successful_uses,
    COUNT(CASE WHEN cu.status = 'failed' THEN 1 END) AS failed_uses,
    MAX(cu.used_at) AS last_used_at
FROM secret_codes sc
LEFT JOIN code_usage cu ON sc.id = cu.code_id
WHERE sc.is_active = true
GROUP BY sc.id, sc.code, sc.description, sc.max_uses, sc.current_uses, sc.created_at, sc.updated_at
ORDER BY sc.created_at DESC;

-- Insert default secret codes (migrate from environment variable)
-- This will be handled by the migration script
