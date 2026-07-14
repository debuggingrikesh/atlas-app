# ERROR_HANDLING_STRATEGY.md

# Project Atlas Error Handling Strategy

Version: 1.0  
Status: Engineering Standard  
Document Type: Application Reliability Architecture  
Last Updated: July 2026

---

# 1. Purpose

This document defines the error handling architecture for Project Atlas.

The objective is to create a consistent system for:

- Detecting errors
- Handling failures safely
- Communicating problems to users
- Logging useful debugging information
- Protecting sensitive information
- Maintaining system reliability

All application layers must follow this strategy.

---

# 2. Error Handling Principles

## 2.1 Fail Predictably

Every failure should have:

- Known error type
- Clear response
- Appropriate logging
- Recovery path

---

## 2.2 Never Expose Internal Details

Users should never see:

- Database errors
- Stack traces
- Internal paths
- Secret information

Example:

Bad:


PrismaClientKnownRequestError:
Unique constraint failed on User.email


Good:


An account with this email already exists.


---

## 2.3 Errors Are Part of Architecture

Errors should be designed like:

- APIs
- Database models
- Components

They must be consistent across the platform.

---

# 3. Error Categories

Project Atlas uses the following error hierarchy:


Application Error

|

|

Validation Error

Authentication Error

Authorization Error

Resource Error

Database Error

External Service Error

System Error


---

# 4. Application Error Model

All custom errors should extend a base application error.

Example:

```ts
class AppError extends Error {
  code: string
  statusCode: number

  constructor(
    message:string,
    code:string,
    statusCode:number
  ){
    super(message)

    this.code = code
    this.statusCode = statusCode
  }
}
5. Standard Error Codes

Project Atlas uses predictable error codes.

Example:

AUTH_REQUIRED

AUTH_INVALID

PERMISSION_DENIED

VALIDATION_FAILED

RESOURCE_NOT_FOUND

RESOURCE_EXISTS

DATABASE_ERROR

INTERNAL_ERROR
6. HTTP Status Mapping
Error Type	Status
Validation Error	400
Authentication Error	401
Authorization Error	403
Not Found	404
Conflict	409
Rate Limit	429
Server Error	500
7. API Error Response Format

All APIs return:

Success
{
 "success": true,
 "data": {}
}
Error
{
 "success": false,
 "error": {
   "code":"VALIDATION_FAILED",
   "message":"Invalid input",
   "details":[]
 }
}
8. API Error Flow

Every API request follows:

Request

↓

Authentication Check

↓

Input Validation

↓

Authorization Check

↓

Business Logic

↓

Database Operation

↓

Response

Errors are captured at every stage.

9. Validation Errors

Validation failures happen when:

Missing fields
Invalid formats
Incorrect values

Example:

Input:

{
 "email":"invalid"
}

Response:

{
 "success":false,
 "error":{
   "code":"VALIDATION_FAILED",
   "message":"Invalid email format"
 }
}
10. Authentication Errors

Authentication errors include:

Missing session
Expired session
Invalid token
Failed login

Example:

{
 "success":false,
 "error":{
  "code":"AUTH_REQUIRED",
  "message":"Please login"
 }
}
11. Authorization Errors

Authorization errors occur when:

User lacks permission
Wrong business access
Wrong role

Example:

MEMBER

tries

OWNER action

Response:

{
 "code":"PERMISSION_DENIED"
}
12. Multi-Tenant Error Handling

Tenant isolation errors must never reveal data.

Bad:

Business ABC does not exist

Good:

Resource not found

Example:

User attempts:

Business A User

requests

Business B Customer

System returns:

RESOURCE_NOT_FOUND
13. Database Error Handling

Database errors must be translated.

Never return raw Prisma errors.

Example:

Database:

Unique constraint violation

Converted:

RESOURCE_EXISTS
14. Prisma Error Mapping

Common mappings:

Prisma Error	Application Error
P2002	RESOURCE_EXISTS
P2025	RESOURCE_NOT_FOUND
P2003	VALIDATION_FAILED
15. Transaction Error Handling

Critical workflows use transactions.

Example:

Onboarding:

Create UserProfile

↓

Create Business

↓

Create Branch

↓

Create Member

If failure:

Rollback Everything

Transaction errors must:

Rollback
Log details
Return safe response
16. Service Layer Error Rules

Services should:

Throw application errors
Not return raw database errors

Example:

Bad:

return prisma.business.create()

Good:

try {

 return await prisma.business.create()

}

catch(error){

 throw new DatabaseError()

}
17. Frontend Error Handling

Frontend should handle:

Loading states
Empty states
Error states
Retry states

Example:

API Failure:

Request Failed

↓

Display Friendly Message

↓

Allow Retry
18. Form Error Handling

Forms should show:

Field errors:

Email already exists

Not:

Request failed

Validation errors should map:

API Error

↓

Field Message

↓

User Correction
19. Toast Notification Standards

Use toast messages for:

Temporary feedback.

Examples:

Success:

Business created successfully

Error:

Unable to save changes

Avoid:

Long technical messages.

20. Global Error Boundary

Frontend requires:

Component Error

↓

Error Boundary

↓

Fallback UI

Example:

Something went wrong.

Try refreshing the page.
21. Logging Strategy

Every server error should log:

Timestamp

User ID

Business ID

Request ID

Error Code

Stack Trace

Never log:

Passwords
Tokens
Personal secrets
22. Development vs Production Errors
Development

Allowed:

Detailed logs
Stack traces
Debug information
Production

Allowed:

User-safe messages
Error IDs
Monitoring data
23. Error Monitoring

Production should track:

Error frequency
Failed requests
Slow operations
Database failures

Recommended future integration:

Application

↓

Error Monitoring Service

↓

Alerts
24. Retry Strategy

Retry automatically only for:

Temporary failures
Network issues
External service failures

Do not retry:

Validation errors
Permission errors
Invalid requests
25. External Service Errors

Examples:

Supabase
Payment providers
Email services
Third-party APIs

Handling:

External Failure

↓

Capture Error

↓

Fallback Response

↓

Log Details
26. Rate Limit Errors

When limits are exceeded:

Return:

{
 "code":"RATE_LIMIT_EXCEEDED",
 "message":"Too many requests"
}
27. Security Error Rules

Never reveal:

Whether another user exists
Internal database structure
Permission details

Example:

Bad:

User exists but belongs to another company

Good:

Resource unavailable
28. AI Development Rules

AI-generated code must:

Always:

Use existing error classes
Follow API response format
Handle failures explicitly
Add proper logging

Never:

Add console.log debugging permanently
Expose raw errors
Ignore catch blocks
29. Error Handling Checklist

Before merging:

[ ] Errors have proper codes

[ ] API responses follow standard format

[ ] Database errors are mapped

[ ] Tenant errors are protected

[ ] User messages are friendly

[ ] Logs contain useful context

[ ] No sensitive data exposed
30. Future Improvements

Planned:

Central error package
Automatic error reporting
Advanced alerting
Error analytics dashboard
AI-powered debugging assistant
Conclusion

Project Atlas uses a structured error handling architecture to maintain reliability as the platform grows.

A consistent error system ensures:

Better developer experience
Better user experience
Safer operations
Easier debugging
Faster scaling

Errors are treated as first-class application behavior, not unexpected failures.


`ERROR_HANDLING_STRATEGY.md` is complete.

Remaining high-value document:

`AI_DEVELOPMENT_GUIDELINES.md`

This is especially relevant for Atlas because the development workflow is heavily AI-assisted with Antigravity, Claude, Gemini, and GPT.
move ahead

Next document:

AI_DEVELOPMENT_GUIDELINES.md

This will define how AI coding agents should work inside Project Atlas so future development remains consistent and does not create architecture drift.

It will cover:

AI agent operating principles
Required documents AI must read before coding
Code modification rules
Architecture protection rules
Database migration rules
Feature development workflow
Testing requirements
Review checklist
Prompt standards for AI agents
Forbidden AI behaviors
How to handle existing code changes
Multi-agent collaboration rules
Debugging workflow
Documentation update rules

I will provide it in a single .md box.

proceed
# AI_DEVELOPMENT_GUIDELINES.md

# Project Atlas AI Development Guidelines

Version: 1.0  
Status: Engineering Standard  
Document Type: AI-Assisted Development Framework  
Last Updated: July 2026

---

# 1. Purpose

Project Atlas uses AI-assisted development to accelerate engineering while maintaining architectural integrity.

This document defines rules for AI coding agents working on the project.

Applicable AI agents:

- Claude
- Gemini
- GPT
- Cursor
- Antigravity
- GitHub Copilot
- Other development assistants

The objective:


Increase Development Speed

Maintain Code Quality

Protect Architecture


---

# 2. Core Principle

AI is a development accelerator, not an architecture decision maker.

AI agents must:

- Follow existing architecture
- Understand before modifying
- Make minimal changes
- Preserve patterns
- Verify all changes

---

# 3. Required Context Before Coding

Before modifying code, AI agents must understand:

## Architecture Documents

Read:


ARCHITECTURE.md

DATABASE_DESIGN.md

API_DESIGN.md

FRONTEND_ARCHITECTURE.md

BACKEND_ARCHITECTURE.md

MODULE_ARCHITECTURE.md

SAAS_MULTI_TENANCY_DESIGN.md


---

## Engineering Rules

Read:


CODING_STANDARDS.md

DEVELOPMENT_GUIDELINES.md

ERROR_HANDLING_STRATEGY.md

SECURITY_ARCHITECTURE.md


---

# 4. AI Development Workflow

Every AI task follows:


Understand

↓

Plan

↓

Implement

↓

Verify

↓

Document


---

# 5. Understand Phase

Before writing code, AI must:

1. Identify affected modules
2. Read existing implementation
3. Understand data flow
4. Check existing patterns
5. Identify dependencies

---

Bad approach:


User requests feature

↓

Immediately create files


---

Correct approach:


User requests feature

↓

Analyze existing architecture

↓

Suggest implementation

↓

Modify code


---

# 6. Planning Phase

Before implementation, AI should provide:

## Change Summary

Example:


Files affected:

src/modules/customer/

src/lib/services/

prisma/schema.prisma


---

## Implementation Plan

Example:

Add database model
Create service layer
Add API endpoint
Add UI component
Add tests

---

# 7. Code Modification Rules

AI must:

## Follow Existing Patterns

If the project uses:


Service Layer

Schema Validation

Type Definitions


AI must continue using them.

---

Do not introduce:

- New frameworks
- New libraries
- New architecture patterns

without approval.

---

# 8. Minimal Change Principle

AI should modify the smallest possible surface area.

Preferred:


Fix one file

↓

Verify

↓

Continue


Avoid:


Rewrite entire module


---

# 9. File Creation Rules

New files should only be created when:

- Required by architecture
- Improves separation
- Adds maintainability

---

Before creating:

Ask:


Does this already exist?

Can existing file be extended?

Does architecture require this?


---

# 10. Database Rules

Database changes are high impact.

AI must:

Before changing schema:


Check existing models

Check relations

Check migrations

Check tenant impact


---

Never:

- Delete fields blindly
- Modify applied migrations
- Remove indexes without analysis

---

# 11. Multi-Tenancy Rules

Critical:

Every new data model must answer:


Which business owns this data?


---

Tenant-owned models require:

```prisma
businessId

Every query must include:

where:{
 businessId
}
12. Authentication Rules

AI must never bypass:

Authentication
Authorization
Permission checks

Protected flow:

Request

↓

Session Check

↓

User

↓

Business Membership

↓

Permission

↓

Action
13. API Development Rules

Every API must include:

Authentication

↓

Validation

↓

Authorization

↓

Business Logic

↓

Response

AI must use:

Existing response format
Existing error handling
Existing validation patterns
14. Frontend Development Rules

AI must respect:

Server Components

Default choice.

Client Components

Only when required:

State
Events
Browser APIs

Avoid unnecessary:

"use client"
15. Component Creation Rules

Before creating component:

Check:

Can existing component be reused?

Is responsibility clear?

Does it belong in module?

Avoid:

Giant components
Duplicate UI
Mixed business logic
16. Testing Requirements

Every feature must include:

Functional Testing

Verify:

Feature works
Error Testing

Verify:

Invalid input

Unauthorized access

Failure scenarios
Tenant Testing

Verify:

Business A

cannot access

Business B data
17. Verification Requirements

After code changes AI must run:

npm run lint

npx tsc --noEmit

npm run build

If tests exist:

Run:

npm test

or project equivalent.

18. Debugging Workflow

When fixing bugs:

Follow:

Reproduce

↓

Identify Root Cause

↓

Fix Minimum Issue

↓

Test

↓

Document

Do not:

Hide errors
Remove validation
Disable security checks
19. Prompt Standards

Good AI prompts include:

Context

Example:

Project Atlas SaaS platform.
Using Next.js + Prisma + Supabase.
Objective

Example:

Implement customer management module.
Constraints

Example:

Follow existing module architecture.
Do not modify authentication.
Verification

Example:

Run lint and type checks.
20. Recommended AI Prompt Template
You are working on Project Atlas.

Before making changes:

1. Read relevant architecture documents.

2. Analyze existing implementation.

3. Explain root cause or approach.

4. Make minimal changes.

5. Verify using:
- lint
- type check
- tests

6. Summarize files changed.
21. AI Forbidden Actions

AI must not:

Architecture Changes

Without approval:

Change database strategy
Replace authentication system
Introduce new frameworks
Security Changes

Never:

Remove permission checks
Disable validation
Expose sensitive data
Database Changes

Never:

Drop tables
Remove tenant filters
Modify production migrations
22. Multiple AI Agent Collaboration

When multiple agents work:

Each agent must:

Understand current branch state
Avoid conflicting edits
Document changes

Recommended division:

Agent 1:

Architecture

Agent 2:

Backend

Agent 3:

Frontend

Agent 4:

Testing
23. Documentation Rules

Any architectural change requires:

Update:

Relevant .md document

Examples:

Database change:

DATABASE_DESIGN.md

New module:

MODULE_ARCHITECTURE.md

Security change:

SECURITY_ARCHITECTURE.md
24. Code Review Checklist

Before accepting AI-generated code:

Check:

[ ] Architecture followed

[ ] Security maintained

[ ] Tenant isolation maintained

[ ] Error handling implemented

[ ] Tests added

[ ] Documentation updated

[ ] No unnecessary complexity
25. AI Quality Standard

AI-generated code should be:

Production ready
Type safe
Tested
Maintainable
Consistent with existing code
26. Future AI Improvements

Future automation:

AI code review
AI test generation
AI documentation sync
AI architecture validation
Automated regression detection