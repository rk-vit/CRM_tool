import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';
import { leads, timelineEvents, callLogs, emailLogs, comments, projects } from '../lib/mock-data';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('--- Database Seeding Started ---');

  try {
    // 1. Clean up existing tables and types
    console.log('Cleaning up existing database objects...');
    await sql`DROP TABLE IF EXISTS blocked_numbers CASCADE`;
    await sql`DROP TABLE IF EXISTS unknown_callers CASCADE`;
    await sql`DROP TABLE IF EXISTS comments CASCADE`;
    await sql`DROP TABLE IF EXISTS email_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS call_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS timeline_events CASCADE`;
    await sql`DROP TABLE IF EXISTS leads CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS projects CASCADE`;

    await sql`DROP TYPE IF EXISTS user_role CASCADE`;
    await sql`DROP TYPE IF EXISTS lead_status CASCADE`;
    await sql`DROP TYPE IF EXISTS lead_sub_status CASCADE`;
    await sql`DROP TYPE IF EXISTS lead_source CASCADE`;
    await sql`DROP TYPE IF EXISTS event_type CASCADE`;
    await sql`DROP TYPE IF EXISTS call_direction CASCADE`;
    await sql`DROP TYPE IF EXISTS call_status CASCADE`;
    await sql`DROP TYPE IF EXISTS email_status CASCADE`;

    // 2. Create Enums
    console.log('Creating enums...');
    await sql`CREATE TYPE user_role AS ENUM ('admin', 'sales')`;
    await sql`CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiation', 'won', 'lost')`;
    await sql`CREATE TYPE lead_sub_status AS ENUM ('hot', 'warm', 'cold')`;
    await sql`CREATE TYPE lead_source AS ENUM ('website', 'google_ads', 'facebook', 'referral', 'direct', '99acres', 'magicbricks')`;
    await sql`CREATE TYPE event_type AS ENUM ('status_change', 'call', 'email', 'comment', 'workflow', 'sms', 'whatsapp', 'meeting')`;
    await sql`CREATE TYPE call_direction AS ENUM ('inbound', 'outbound')`;
    await sql`CREATE TYPE call_status AS ENUM ('answered', 'missed', 'busy', 'no_answer')`;
    await sql`CREATE TYPE email_status AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced')`;

    // 3. Create Tables
    console.log('Creating tables...');
    await sql`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'sales',
        avatar TEXT,
        phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        alternate_phone TEXT,
        project TEXT NOT NULL,
        status lead_status NOT NULL DEFAULT 'new',
        sub_status lead_sub_status NOT NULL DEFAULT 'warm',
        source lead_source NOT NULL DEFAULT 'direct',
        medium TEXT NOT NULL,
        assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
        assigned_users TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        follow_up_date TIMESTAMP WITH TIME ZONE,
        budget TEXT,
        requirements TEXT,
        notes TEXT
      );
    `;

    await sql`
      CREATE TABLE timeline_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        type event_type NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        metadata JSONB
      );
    `;

    await sql`
      CREATE TABLE call_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        caller_number TEXT NOT NULL,
        caller_to TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        direction call_direction NOT NULL,
        status call_status NOT NULL,
        recording_url TEXT,
        assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        exotel_call_sid TEXT
      );
    `;

    await sql`
      CREATE TABLE email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        "from" TEXT NOT NULL,
        "to" TEXT NOT NULL,
        status email_status NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE unknown_callers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone TEXT NOT NULL,
        exotel_call_sid TEXT,
        call_duration INTEGER DEFAULT 0,
        call_status TEXT DEFAULT 'no_answer',
        call_count INTEGER DEFAULT 1,
        recording_url TEXT,
        reviewed BOOLEAN DEFAULT false,
        discarded BOOLEAN DEFAULT false,
        converted_lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE UNIQUE INDEX idx_unknown_callers_phone_unreviewed
      ON unknown_callers (phone)
      WHERE reviewed = false;
    `;

    await sql`
      CREATE TABLE blocked_numbers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone TEXT UNIQUE NOT NULL,
        reason TEXT DEFAULT 'spam',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Seed Data
    console.log('Seeding projects...');
    for (const project of projects) {
      await sql`INSERT INTO projects (name) VALUES (${project}) ON CONFLICT DO NOTHING`;
    }

    console.log('Seeding users...');
    
    // Admin User
    const adminPass = await bcrypt.hash('admin@123', 10);
    await sql`
      INSERT INTO users (id, name, email, password, role, phone)
      VALUES ('admin-1', 'Admin User', 'admin1@gmail.com', ${adminPass}, 'admin', '+91 9876543211')
    `;

    // Sales User 1
    const salesPass = await bcrypt.hash('user1@123', 10);
    await sql`
      INSERT INTO users (id, name, email, password, role, phone)
      VALUES ('user-1', 'Supriya', 'supriya@realestate.com', ${salesPass}, 'sales', '+91 9876543210')
    `;

    // Sales User 2
    const salesPass2 = await bcrypt.hash('user2@123', 10);
    await sql`
      INSERT INTO users (id, name, email, password, role, phone)
      VALUES ('user-2', 'Amit Patel', 'amit@realestate.com', ${salesPass2}, 'sales', '+91 9876543212')
    `;

    // Sales User 3
    const salesPass3 = await bcrypt.hash('user3@123', 10);
    await sql`
      INSERT INTO users (id, name, email, password, role, phone)
      VALUES ('user-3', 'Sneha Reddy', 'sneha@realestate.com', ${salesPass3}, 'sales', '+91 9876543213')
    `;

    console.log('Seeding leads...');
    // We map all mock leads to 'user-1' for testing
    for (const lead of leads) {
      await sql`
        INSERT INTO leads (
          id, name, email, phone, alternate_phone, project, status, sub_status, source, medium, 
          assigned_to, assigned_users, created_at, updated_at, follow_up_date, budget, requirements, notes
        ) VALUES (
          ${lead.id}, ${lead.name}, ${lead.email}, ${lead.phone}, ${lead.alternatePhone || null}, 
          ${lead.project}, ${lead.status}, ${lead.subStatus}, ${lead.source}, ${lead.medium}, 
          'user-1', ${lead.assignedUsers || []}, ${lead.createdAt}, ${lead.updatedAt}, ${lead.followUpDate || null}, 
          ${lead.budget || null}, ${lead.requirements || null}, ${lead.notes || null}
        )
      `;
    }

    console.log('Seeding timeline events...');
    for (const event of timelineEvents) {
      await sql`
        INSERT INTO timeline_events (lead_id, type, title, description, created_at, created_by, metadata)
        VALUES (${event.leadId}, ${event.type}, ${event.title}, ${event.description}, ${event.createdAt}, ${event.createdBy}, ${JSON.stringify(event.metadata || {})})
      `;
    }

    console.log('Seeding call logs...');
    for (const call of callLogs) {
      await sql`
        INSERT INTO call_logs (lead_id, caller_number, caller_to, duration, direction, status, recording_url, assigned_to, created_at)
        VALUES (${call.leadId}, ${call.callerNumber}, ${call.callerTo}, ${call.duration}, ${call.direction}, ${call.status}, ${call.recordingUrl || null}, 'user-1', ${call.createdAt})
      `;
    }

    console.log('Seeding email logs...');
    for (const email of emailLogs) {
      await sql`
        INSERT INTO email_logs (lead_id, subject, body, "from", "to", status, created_at)
        VALUES (${email.leadId}, ${email.subject}, ${email.body}, ${email.from}, ${email.to}, ${email.status}, ${email.createdAt})
      `;
    }

    console.log('Seeding comments...');
    for (const comment of comments) {
      await sql`
        INSERT INTO comments (lead_id, text, created_by, created_at)
        VALUES (${comment.leadId}, ${comment.text}, 'user-1', ${comment.createdAt})
      `;
    }

    console.log('--- Database Seeding Completed Successfully ---');
  } catch (error) {
    console.error('--- Error Seeding Database ---');
    console.error(error);
    process.exit(1);
  }
}

main();
