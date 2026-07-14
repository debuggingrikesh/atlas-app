# SaaS Multi-Tenancy Design Document

## Project Atlas

Version: 1.0  
Status: Architecture Specification  
Document Type: SaaS Platform Architecture  
Last Updated: July 2026

---

# 1. Executive Summary

Project Atlas is designed as a multi-tenant SaaS platform.

The platform allows multiple independent businesses to use the same application infrastructure while maintaining:

- Complete data isolation
- Independent business configuration
- Role-based access control
- Scalable module architecture
- Secure resource ownership

The multi-tenancy architecture is the foundation that enables Project Atlas to serve multiple industries through configurable templates.

---

# 2. Multi-Tenancy Definition

Multi-tenancy means:


One Application

Multiple Businesses

Shared Infrastructure

Separated Data


Example:


Project Atlas

    |

| | |

Hospital A School B Agency C


Each business operates independently.

---

# 3. Multi-Tenant Goals

The architecture must provide:

## Data Isolation

Business data must never leak between tenants.

---

## Configuration Isolation

Each business can have:

- Different settings
- Different users
- Different branches
- Different modules

---

## Operational Scalability

The platform should support:


10 Businesses

↓

1,000 Businesses

↓

100,000 Businesses


without architectural replacement.

---

# 4. Tenant Hierarchy Model

Project Atlas uses:


User

↓

Business Membership

↓

Business

↓

Branch

↓

Business Data


---

Example:


Rikesh

|

Member of

|

DebugDream

|

Branches

|

Kathmandu Office

Pokhara Office


---

# 5. Core Tenant Entities

## 5.1 Business

The Business model represents the tenant.

Example:


Business

Name:
DebugDream Pvt Ltd

Industry:
Software Company


---

Responsibilities:

- Tenant identity
- Ownership boundary
- Configuration container

---

## 5.2 Branch

A Business may have multiple branches.

Example:


Hospital

|

Branches

|

Kathmandu

Lalitpur

Pokhara


---

Purpose:

- Location management
- Operational separation
- Future reporting

---

## 5.3 UserProfile

Represents a platform user.

A user can belong to:


One Business

or

Multiple Businesses


---

Example:


Consultant

works with:

Business A

Business B


---

## 5.4 BusinessMember

The relationship between:


User

Business

Role


---

Example:


User

↓

BusinessMember

↓

OWNER role

↓

Business


---

# 6. Database Multi-Tenancy Strategy

Project Atlas uses:


Shared Database

Shared Schema

Tenant Identifier


Model:


PostgreSQL

|

Tables

|

businessId column

|

Tenant Data


---

Example:

Business table:


id
name
slug


---

Future module table:


Customer

id

businessId

name

email


---

Every tenant-owned table contains:


businessId


---

# 7. Why Shared Database Model

Advantages:

## Simple Operations

One database to maintain.

---

## Lower Cost

No database per customer.

---

## Faster Development

Simpler migrations.

---

## Easier Analytics

Centralized reporting.

---

# 8. Tenant Isolation Rules

Critical rule:

Every tenant query must include:


businessId


---

Incorrect:

```ts
prisma.customer.findMany()

Problem:

Returns all customers.

Correct:

prisma.customer.findMany({
 where:{
  businessId
 }
})
9. Tenant Context Management

Every request must establish:

Current User

+

Current Business

+

Permissions

Flow:

Request

↓

Authentication

↓

User Lookup

↓

Business Membership

↓

Tenant Context

↓

Database Query
10. Tenant Context Object

Recommended structure:

{
 userId,
 businessId,
 role
}

Example:

{
 userId:"usr_123",
 businessId:"biz_456",
 role:"ADMIN"
}

All business operations require this context.

11. Authorization Architecture

Authorization hierarchy:

Authentication

↓

Membership

↓

Role

↓

Permission

↓

Action

Example:

User Login

↓

Member Of Hospital A

↓

ADMIN

↓

Can Manage Staff
12. Role Model

Current roles:

OWNER

ADMIN

MEMBER
12.1 OWNER

Highest authority.

Permissions:

Manage business
Manage members
Configure settings
Access all modules
12.2 ADMIN

Operational administrator.

Permissions:

Manage daily operations
Manage assigned resources
12.3 MEMBER

Standard user.

Permissions:

Access assigned features
13. Future Permission System

Current:

Role-based.

Future:

Permission-based.

Example:

Role

↓

Permissions

↓

Actions

Example:

ADMIN

Permissions:

customer.create

customer.update

customer.delete
14. Module Architecture

Project Atlas modules should be tenant-aware.

Structure:

src/modules

|

|-- auth

|-- onboarding

|-- dashboard

|-- crm

|-- inventory

|-- hospital


Each module:

Module

|

Business Context

|

Permission Check

|

Database Query
15. Tenant-Aware Module Example

CRM module:

Create Customer

↓

Validate User

↓

Get Business Context

↓

Create Customer

businessId attached

↓

Save Database
16. Data Ownership Rules

Every resource belongs to:

Business

or

Branch

Example:

Customer:

Customer

belongs to

Business

belongs to

Branch(optional)
17. Branch-Level Isolation

Future support:

Business

|

Branches

|

Departments

|

Resources

Example:

Hospital:

Hospital Group

|

Kathmandu Branch

|

Emergency Department
18. Audit Architecture

All sensitive actions should create:

AuditLog

Example:

Admin deletes employee

↓

Audit Record Created

Audit contains:

Action

Entity

Actor

Business

Timestamp

Metadata
19. Security Boundaries

Security layers:

Layer 1

Authentication


Layer 2

Business Membership


Layer 3

Authorization


Layer 4

Database Filtering

No single layer should be trusted alone.

20. Tenant Security Testing

Required tests:

Cross Tenant Access

Scenario:

User A

requests

Business B Data

Expected:

Denied
Modified ID Attack

Scenario:

Change:

businessId

in request.

Expected:

Ignored

or

Rejected
21. Scaling Strategy
Stage 1

Current:

Shared Database

Shared Schema

businessId filtering
Stage 2

Growth:

Shared Database

Optimized Indexes

Caching

Read Replicas
Stage 3

Enterprise:

Dedicated Database

Per Enterprise Tenant
22. Database Index Strategy

Tenant-owned tables require:

businessId index

Example:

@@index([businessId])

For common queries:

businessId

+

createdAt
23. SaaS Billing Readiness

Future billing architecture:

Business

↓

Subscription

↓

Plan

↓

Feature Access

Example:

Starter Plan

5 Users

2 Branches


Enterprise Plan

Unlimited
24. Feature Flag Architecture

Future:

Business

↓

Subscription

↓

Feature Flags

Example:

Hospital Module

Enabled

for

Healthcare Customers
25. Data Migration Strategy

As tenants grow:

Migration paths:

Shared Schema

↓

Partitioned Tables

↓

Dedicated Database

Migration should not affect application behavior.

26. Operational Guidelines

Developers must:

Always:

Include businessId
Validate permissions
Log sensitive actions

Never:

Query tenant data without context
Trust client-provided business IDs
Bypass authorization
27. Architecture Decisions
Decision	Reason
Shared Database	Simple scalable foundation
businessId Isolation	Strong tenant boundary
BusinessMember Join Table	Flexible user access
Role-Based Access	MVP simplicity
Future Permission Layer	Enterprise readiness
Audit Logging	Accountability
28. Future Improvements

Planned:

Fine-grained permissions
Tenant analytics
Usage metering
Automated billing
Tenant-specific customization
Dedicated enterprise infrastructure