# CONTRIBUTING.md

# Project Atlas Contribution Guidelines

Version: 1.0  
Status: Engineering Standard  
Document Type: Contributor Guide  
Last Updated: July 2026

---

# 1. Introduction

Thank you for contributing to Project Atlas.

Project Atlas is built as a scalable multi-tenant SaaS platform. Every contribution must preserve:

- Code quality
- Security
- Maintainability
- Architectural consistency
- Long-term scalability

This document defines the workflow for developers and AI-assisted contributors.

---

# 2. Contribution Principles

All contributions should follow:

## Quality Over Speed

Fast implementation is valuable, but maintainable architecture is the priority.

---

## Small Changes

Prefer:


Small Feature

↓

Review

↓

Merge


Over:


Large Rewrite

↓

Difficult Review


---

## Documentation First

Architecture changes require documentation updates.

---

# 3. Repository Structure

Main structure:


project-atlas/

├── src/
├── prisma/
├── docs/
├── public/
├── tests/
├── package.json
└── README.md


---

# 4. Development Setup

Before contributing:

Install dependencies:

```bash
npm install

Generate Prisma client:

npx prisma generate

Run development server:

npm run dev

Required checks:

npm run lint

npx tsc --noEmit
5. Branch Strategy

Project Atlas uses feature branches.

Main branches:

main

develop

Feature branches:

Format:

feature/<name>

Example:

feature/customer-management

Bug fixes:

fix/<name>

Example:

fix/auth-session-expiry

Documentation:

docs/<name>

Example:

docs/api-update
6. Branch Rules

Never directly commit to:

main

unless specifically approved.

Workflow:

Create Branch

↓

Develop

↓

Test

↓

Create Pull Request

↓

Review

↓

Merge
7. Commit Guidelines

Commits must follow:

type(scope): message

Examples:

Feature:

feat(auth): add password reset flow

Bug fix:

fix(onboarding): preserve wizard state

Documentation:

docs(database): update schema documentation

Refactor:

refactor(api): simplify response handling

Commit types:

feat
fix
docs
refactor
test
chore
perf
8. Commit Rules

Good commits:

Small
Focused
Descriptive

Avoid:

update stuff
changes
fixed many things
9. Feature Development Workflow

Every feature follows:

Requirement

↓

Architecture Review

↓

Implementation Plan

↓

Development

↓

Testing

↓

Documentation

↓

Pull Request
10. Before Coding

Contributor should:

Understand requirements
Check existing modules
Review architecture documents
Identify affected systems

Relevant documents:

docs/ARCHITECTURE.md

docs/MODULE_ARCHITECTURE.md

docs/DATABASE_DESIGN.md

docs/API_DESIGN.md
11. Module Development Rules

New modules must follow:

src/modules/<module-name>

Structure:

module/

components/

hooks/

services/

schemas/

types/

utils/

Every module must define:

Responsibilities
Database models
API requirements
Permissions
Tests
12. Database Change Process

Database changes require:

Step 1

Update:

prisma/schema.prisma
Step 2

Create migration:

npx prisma migrate dev
Step 3

Verify:

npx prisma generate
Step 4

Update:

DATABASE_DESIGN.md

if architecture changes.

13. Multi-Tenancy Requirements

Every contributor must protect tenant isolation.

Before adding models:

Ask:

Who owns this data?

Tenant-owned models require:

businessId

Queries must include:

where:{
 businessId
}
14. API Contribution Rules

Every API endpoint requires:

Authentication

↓

Validation

↓

Authorization

↓

Business Logic

↓

Response

Use existing:

Error format
Validation patterns
Response structures
15. Frontend Contribution Rules

Components must:

Follow existing design system
Use TypeScript
Avoid unnecessary client components
Handle loading states
Handle error states

Avoid:

Duplicate components
Large components
Business logic inside UI
16. Testing Requirements

Before submitting:

Run:

npm run lint

npx tsc --noEmit

For feature changes:

Add:

Unit tests
Integration tests
API tests where required

Test:

Success Cases

Example:

Valid user creates resource
Failure Cases

Example:

Unauthorized user attempts action
Tenant Cases

Example:

Business A cannot access Business B data
17. Pull Request Process

Every PR must include:

Title

Follow commit style.

Example:

feat(crm): add customer management
Description

Include:

What changed?

Why?

How tested?

Any migration required?
Screenshots

Required for:

UI changes
UX changes
18. Pull Request Checklist

Before submitting:

[ ] Code follows standards

[ ] Tests pass

[ ] Type checking passes

[ ] Documentation updated

[ ] No security issues

[ ] Tenant isolation verified

[ ] Database changes reviewed
19. Code Review Guidelines

Reviewers check:

Architecture

Does it follow the system design?

Security

Are permissions enforced?

Database

Are queries optimized and tenant-safe?

Maintainability

Can another developer understand this?

20. AI-Assisted Contributions

AI tools are allowed and encouraged.

Examples:

Claude
Gemini
GPT
Cursor
Copilot
Antigravity

AI-generated code must:

Follow architecture documents
Pass lint
Pass type checks
Be reviewed
Not introduce unnecessary complexity
21. AI Contribution Rules

AI must not:

Rewrite entire modules unnecessarily
Remove security checks
Modify database architecture without review
Create duplicate patterns

Before AI changes:

Provide:

Context

Goal

Constraints

Verification Requirements
22. Documentation Requirements

Update documentation when changing:

Architecture:

ARCHITECTURE.md

Database:

DATABASE_DESIGN.md

API:

API_DESIGN.md

Security:

SECURITY_ARCHITECTURE.md

Modules:

MODULE_ARCHITECTURE.md
23. Release Process

Before release:

Required:

Lint

Type Check

Tests

Build

Database Verification

Release checklist:

[ ] Environment variables verified

[ ] Migration tested

[ ] Documentation updated

[ ] Deployment verified
24. Reporting Issues

Issues should include:

Bug Report
Description

Steps to reproduce

Expected behavior

Actual behavior

Environment
Feature Request
Problem

Proposed solution

Expected impact
25. Final Contribution Standard

A contribution is complete when:

Code Works

+

Architecture Preserved

+

Tests Pass

+

Documentation Updated