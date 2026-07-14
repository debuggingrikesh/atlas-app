# Deployment Architecture Document

## Project Atlas

Version: 1.0  
Status: Architecture Specification  
Document Type: Technical Architecture  
Last Updated: July 2026

---

# 1. Executive Summary

Project Atlas is a multi-tenant SaaS platform designed to provide configurable business management capabilities across different industries.

The deployment architecture defines how Project Atlas is developed, deployed, monitored, secured, and scaled across environments.

The architecture prioritizes:

- Reliability
- Security
- Developer velocity
- Infrastructure simplicity
- Production scalability

The initial deployment model uses:

| Component | Technology |
|---|---|
| Frontend | Next.js 16 App Router |
| Backend | Next.js Server Actions + API Routes |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Authentication | Supabase Auth |
| Hosting | Vercel |
| Database Hosting | Supabase |
| Package Manager | npm |

---

# 2. Deployment Goals

The deployment architecture must support:

## Development Velocity

Engineers should be able to:

- Run the entire platform locally
- Test database changes safely
- Create isolated features
- Deploy quickly

---

## Reliability

The platform should provide:

- Predictable deployments
- Automated validation
- Rollback capability
- Database consistency

---

## Security

The deployment system must protect:

- Authentication credentials
- Database access
- User information
- Business data

---

## Scalability

The architecture should support growth from:


Early MVP

↓

Growing SaaS

↓

Enterprise Platform


---

# 3. Deployment Environment Model

Project Atlas uses four environments:

                Git Repository

                     |

    ---------------------------------

    |               |               |

Local Dev       Preview          Production

    |               |               |

Developer Pull Request Users


---

# 4. Environment Definitions

## 4.1 Local Development Environment

Purpose:

Daily development and feature creation.

Used by:

- Developers
- AI coding assistants
- Local testing

Components:


Developer Machine

↓

Next.js Development Server

↓

Local Environment Variables

↓

Supabase Development Database

↓

Prisma Client


---

Required services:

```bash
npm install

npx prisma generate

npx prisma migrate dev

npm run db:seed

npm run dev
4.2 Preview Environment

Purpose:

Testing changes before production release.

Created automatically from:

Git Branch

↓

Pull Request

↓

Vercel Preview Deployment

Used for:

QA testing
Feature validation
Stakeholder review
4.3 Staging Environment

Purpose:

Production-like testing.

Characteristics:

Production configuration
Separate database
Separate authentication project
Real deployment pipeline

Used for:

Migration testing
Performance testing
Release validation
4.4 Production Environment

Purpose:

Serve real customers.

Characteristics:

High availability
Protected secrets
Monitoring enabled
Backup enabled
5. Infrastructure Overview
High Level Architecture
6. Core Infrastructure Components
6.1 Next.js Application

Responsibilities:

UI rendering
Server components
API endpoints
Route protection
Business logic orchestration

Deployment:

Vercel
6.2 Supabase Authentication

Responsibilities:

User registration
Login
Sessions
Token handling

Project Atlas does not store passwords.

Authentication ownership:

Supabase Auth

↓

Application UserProfile
6.3 PostgreSQL Database

Responsibilities:

Persistent data
Business records
User profiles
Audit history

Managed by:

Supabase PostgreSQL
6.4 Prisma ORM

Responsibilities:

Database access
Schema management
Migration control

Workflow:

schema.prisma

↓

Migration

↓

Database

↓

Generated Client
7. Deployment Flow

Production deployment lifecycle:

Invalid or unsupported diagram.
8. Git Strategy

Recommended workflow:

main

|

|-- feature/authentication

|-- feature/dashboard

|-- feature/modules


Branch rules:

Main Branch

Contains:

Production-ready code
Reviewed changes only
Feature Branch

Contains:

New functionality
Bug fixes
Experiments
9. Deployment Rules

Every deployment must pass:

npm run lint

npx tsc --noEmit

npm run build

No deployment should happen with:

Type errors
Failed migrations
Broken tests
Missing environment variables
10. Environment Variables Architecture

Environment variables are separated into:

Public Variables

+

Server Secrets
Public Variables

Accessible by browser.

Examples:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY
Server Secrets

Never exposed.

Examples:

DATABASE_URL

SUPABASE_SERVICE_ROLE_KEY
11. Environment Variable Management

Rules:

Never commit .env
Maintain .env.example
Rotate production secrets
Separate environments

Example:

.env.local

.env.staging

.env.production
12. Deployment Checklist

Before deployment:

[ ] Environment variables configured

[ ] Database migration reviewed

[ ] Build successful

[ ] Tests passing

[ ] Security review completed

[ ] Monitoring active

# 13. Vercel Deployment Strategy

## 13.1 Overview

Project Atlas uses Vercel as the primary application deployment platform.

Vercel provides:

- Global CDN
- Automatic deployments
- Preview environments
- Serverless execution
- Edge capabilities
- Deployment rollback

Deployment architecture:


GitHub Repository

    |

    ↓

Vercel Build System

    |

    ↓

Next.js Application

    |

    ↓

Production Traffic


---

# 13.2 Production Deployment Flow

Production deployment follows:


Developer

↓

Feature Branch

↓

Pull Request

↓

Automated Checks

↓

Code Review

↓

Merge to Main

↓

Vercel Production Build

↓

Deployment

↓

Monitoring


---

# 13.3 Build Process

Vercel executes:

```bash
npm install

↓

prisma generate

↓

next build

↓

deployment

The build must validate:

TypeScript compilation
Next.js compilation
Prisma generation
Static analysis
13.4 Preview Deployments

Every pull request should generate:

Pull Request

↓

Unique Preview URL

↓

QA Testing

↓

Approval

Preview environments allow:

Feature testing
Client review
UI validation
Regression checking
13.5 Rollback Strategy

If a production deployment causes issues:

Production Failure

↓

Identify Previous Stable Deployment

↓

Rollback

↓

Investigate Issue

↓

Deploy Fix

Rollback priorities:

Restore availability
Protect data integrity
Investigate root cause
14. Supabase Production Architecture
14.1 Overview

Supabase provides:

PostgreSQL database
Authentication
Storage
Database APIs

Architecture:

Next.js Application

        |

        |

Supabase Services

        |

------------------------

|          |            |

Auth    Database    Storage

14.2 Supabase Authentication

Responsibilities:

User identity
Session management
Password handling
Token generation

Flow:

User Login

↓

Supabase Auth

↓

Session Created

↓

Application Validates User

↓

UserProfile Loaded
14.3 Database Architecture

Production database:

PostgreSQL

|

Schemas

|

Tables

|

Indexes

|

Relations

Core tables:

IndustryTemplate

Business

Branch

UserProfile

BusinessMember

AuditLog
14.4 Database Access Pattern

Application never directly manipulates database connections.

Flow:

API Layer

↓

Service Layer

↓

Prisma Client

↓

PostgreSQL

Benefits:

Centralized logic
Better testing
Safer queries
Easier migrations
14.5 Supabase Storage

Future storage requirements:

Business logos
User avatars
Documents
Reports

Storage flow:

User Upload

↓

Application Validation

↓

Supabase Storage

↓

Secure URL

↓

Database Reference
15. Database Migration Strategy
15.1 Migration Philosophy

Database changes must always be:

Version controlled
Reviewable
Reversible

Prisma migrations are the source of truth.

15.2 Development Migration

Developer workflow:

Modify schema.prisma

↓

Create Migration

↓

Review SQL

↓

Apply Locally

Command:

npx prisma migrate dev --name migration_name
15.3 Staging Migration

Process:

Migration Created

↓

Applied To Staging

↓

Application Tested

↓

Approved For Production
15.4 Production Migration

Production migrations require:

Backup

↓

Migration Review

↓

Migration Execution

↓

Verification

↓

Monitoring
15.5 Migration Rules

Never:

Edit production database manually
Delete migration history
Skip migration review

Always:

Commit migration files
Test before deployment
Backup before major changes
16. CI/CD Pipeline
16.1 Pipeline Overview
Code Push

↓

CI Pipeline

↓

Validation

↓

Build

↓

Deployment
16.2 Continuous Integration Checks

Every pull request should execute:

npm run lint

npx tsc --noEmit

npm run build

Future additions:

Unit Tests

Integration Tests

Security Scan
16.3 Continuous Deployment

Production deployment:

Main Branch Updated

↓

CI Passed

↓

Automatic Deployment

↓

Health Check

↓

Release
17. Database Backup Strategy
17.1 Backup Goals

Protect against:

Data corruption
Human mistakes
Failed migrations
Infrastructure failures
17.2 Backup Types
Automated Backups

Frequency:

Daily
Logical Backups

Used for:

Data export
Migration
Recovery
Restore Testing

Backups must periodically be tested.

A backup without restore validation is incomplete.

18. Disaster Recovery
Recovery Objectives

Project Atlas defines:

Recovery Point Objective (RPO)

Maximum acceptable data loss.

Target:

24 hours
Recovery Time Objective (RTO)

Maximum acceptable downtime.

Target:

Few hours
18.1 Disaster Scenarios
Database Failure

Response:

Detect Failure

↓

Restore Database

↓

Validate Data

↓

Resume Service
Deployment Failure

Response:

Detect Issue

↓

Rollback Deployment

↓

Investigate

↓

Redeploy Fix
Authentication Failure

Response:

Monitor Auth Errors

↓

Verify Supabase Status

↓

Restore Service
19. Security Deployment Practices
19.1 Secret Protection

Rules:

Secrets stored only in deployment platform
No secrets in Git
Rotate credentials periodically
19.2 Access Control

Production access limited to:

Authorized developers
Administrators
19.3 Dependency Security

Regular checks:

npm audit

Review:

Vulnerable packages
Outdated dependencies
Security patches
20. Performance Scaling Strategy

Project Atlas scaling path:

Stage 1

MVP

↓

Single Next.js Deployment

↓

Managed PostgreSQL


Stage 2

Growth

↓

Caching Layer

↓

Background Workers


Stage 3

Enterprise

↓

Service Separation

↓

Advanced Infrastructure
21. Infrastructure Evolution
Current Architecture
Next.js

+

Supabase

+

Prisma

+

Vercel
Future Architecture

Potential additions:

Next.js

+

API Services

+

Queue System

+

Redis

+

Analytics Pipeline

+

Dedicated Workers
22. Operational Runbooks
Application Down

Steps:

Check deployment status
Review logs
Verify environment variables
Check dependencies
Rollback if required
Database Issue

Steps:

Check database availability
Review recent migrations
Inspect queries
Restore if required
Authentication Issue

Steps:

Check Supabase status
Verify configuration
Test login flow
Review auth logs
23. Deployment Checklist
Before Release
[ ] Code reviewed

[ ] Tests passed

[ ] Migration verified

[ ] Environment variables checked

[ ] Build successful

[ ] Backup confirmed
After Release
[ ] Application loads

[ ] Login works

[ ] Database connected

[ ] Error monitoring active

[ ] User flows tested
24. Architecture Decisions
Decision	Reason
Vercel Hosting	Optimized Next.js deployment
Supabase	Managed PostgreSQL + Auth
Prisma	Type-safe database access
Migration Based DB Changes	Controlled evolution
Environment Separation	Safety and reliability
Automated Deployments	Faster iteration
25. Future Improvements

Planned improvements:

Automated integration testing
Infrastructure as Code
Advanced monitoring
Multi-region deployment
Automated disaster recovery
Database read replicas