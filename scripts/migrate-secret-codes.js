#!/usr/bin/env node

/**
 * Migration script to populate initial secret codes from environment variable
 * Usage: node scripts/migrate-secret-codes.js
 */

const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function migrateSecretCodes() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cfp_funding_tool'}`
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Get secret codes from environment
        const secretCodes = process.env.SECRET_CODES 
            ? process.env.SECRET_CODES.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : ['DontTellUncleSam', 'SecretCode123', 'HiddenTreasure'];

        console.log(`Migrating ${secretCodes.length} secret codes...`);

        // Insert codes if they don't exist
        for (const code of secretCodes) {
            try {
                const result = await client.query(
                    `INSERT INTO secret_codes (code, description, max_uses, created_by) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (code) DO NOTHING 
                     RETURNING id`,
                    [code, `Migrated from environment variable`, 1, 'migration']
                );

                if (result.rowCount > 0) {
                    console.log(`✅ Added secret code: ${code}`);
                } else {
                    console.log(`⚠️  Secret code already exists: ${code}`);
                }
            } catch (error) {
                console.error(`❌ Failed to add secret code '${code}':`, error.message);
            }
        }

        // Show current codes
        const codesResult = await client.query(
            `SELECT code, description, max_uses, current_uses, is_active, created_at 
             FROM secret_codes 
             ORDER BY created_at DESC`
        );

        console.log('\n📋 Current secret codes in database:');
        console.table(codesResult.rows);

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    migrateSecretCodes();
}

module.exports = { migrateSecretCodes };
