#!/usr/bin/env node
/**
 * Database initialization script for Turso
 * Run this locally to set up your Turso database
 * 
 * Usage:
 *   node scripts/init-db.js
 * 
 * Required env vars:
 *   DATABASE_URL=libsql://your-db.turso.io
 *   DATABASE_AUTH_TOKEN=your-token
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

if (!DATABASE_URL || !DATABASE_AUTH_TOKEN) {
  console.error('Error: DATABASE_URL and DATABASE_AUTH_TOKEN must be set');
  console.error('\nExample:');
  console.error('  $env:DATABASE_URL="libsql://your-db.turso.io"');
  console.error('  $env:DATABASE_AUTH_TOKEN="your-token"');
  console.error('  node scripts/init-db.js');
  process.exit(1);
}

if (!DATABASE_URL.startsWith('libsql://')) {
  console.error('Error: DATABASE_URL must start with libsql://');
  process.exit(1);
}

const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN,
});

async function init() {
  try {
    console.log('🔄 Initializing database...\n');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'turso-clean.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const stmt of statements) {
      const cleanStmt = stmt + ';';
      console.log(`Running: ${cleanStmt.substring(0, 60)}...`);
      await client.execute(cleanStmt);
    }
    
    console.log('\n✅ Schema created successfully');
    
    // Seed data
    const seedPath = path.join(__dirname, '..', 'turso-seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('\n🌱 Seeding data...\n');
      const seed = fs.readFileSync(seedPath, 'utf-8');
      const seedStatements = seed
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const stmt of seedStatements) {
        const cleanStmt = stmt + ';';
        console.log(`Running: ${cleanStmt.substring(0, 60)}...`);
        await client.execute(cleanStmt);
      }
      console.log('\n✅ Data seeded successfully');
    }
    
    console.log('\n🎉 Database initialized!');
    console.log('\nLogin credentials:');
    console.log('  Username: admin');
    console.log('  Password: demo');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

init();
