# Project Atlas Database Design

Version: 1.0  
Status: Active Development  
Database: PostgreSQL (Supabase)  
ORM: Prisma v7  

---

# 1. Database Overview

Project Atlas uses a multi-tenant relational database architecture.

The database is designed around:

- Multiple businesses using the same platform
- Strong tenant isolation
- Industry-specific expansion
- Role-based access control
- Auditability


Core hierarchy:

```
IndustryTemplate
        |
        |
    Business
        |
        |
      Branch
        |
        |
 BusinessMember
        |
        |
 UserProfile
```

---

# 2. Database Technology

## Database

PostgreSQL

Provider:

Supabase PostgreSQL


## ORM

Prisma ORM v7


## Connection Architecture

```
Application

      |

Prisma Client

      |

PostgreSQL Database
```

---

# 3. Entity Relationship Overview

```
IndustryTemplate
        |
        | 1:N
        |
    Business
        |
        | 1:N
        |
      Branch


Business
        |
        | 1:N
        |
BusinessMember
        |
        | N:1
        |
 UserProfile


Business
        |
        | 1:N
        |
 AuditLog
```

---

# 4. Database Tables

---

# IndustryTemplate

## Purpose

Stores reusable industry configurations.

Examples:

- Healthcare
- Education
- Restaurant
- Retail


## Schema

| Column | Type | Description |
|---|---|---|
| id | String | Primary key |
| name | String | Industry name |
| slug | String | URL identifier |
| description | String | Optional description |
| isActive | Boolean | Availability status |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |


## Constraints

Unique:

```
name
slug
```


## Relations

One IndustryTemplate can have many businesses.

```
IndustryTemplate

        |

   Business[]
```

---

# Business

## Purpose

Represents a tenant organization.

Each business is an isolated customer environment.


Examples:

```
ABC Hospital

XYZ Consultancy

Restaurant Kathmandu
```


## Schema

| Column | Type | Description |
|-|-|-|
| id | String | Primary key |
| name | String | Business name |
| slug | String | Unique URL identifier |
| industryTemplateId | String | Industry reference |
| description | String | Optional description |
| logoUrl | String | Logo location |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |


## Relations

Belongs to:

```
IndustryTemplate
```


Has:

```
Branches

Members
```


## Indexes

```
industryTemplateId
```

---

# Branch

## Purpose

Represents physical locations or operational units.


Examples:

```
Kathmandu Branch

Pokhara Branch
```


## Schema

| Column | Type | Description |
|-|-|-|
| id | String | Primary key |
| name | String | Branch name |
| businessId | String | Tenant reference |
| address | String | Location |
| isActive | Boolean | Status |
| createdAt | DateTime | Created timestamp |
| updatedAt | DateTime | Updated timestamp |


## Relations

Belongs to:

```
Business
```


## Delete Behavior

When Business is deleted:

```
Branch records cascade delete
```


## Indexes

```
businessId
```

---

# UserProfile

## Purpose

Stores application-level user information.

Authentication identity is managed by Supabase Auth.


Relationship:

```
Supabase Auth User

        |

    UserProfile
```


## Schema

| Column | Type | Description |
|-|-|-|
| id | String | Supabase user ID |
| email | String | User email |
| fullName | String | Display name |
| avatarUrl | String | Profile image |
| onboardingStep | Int | Progress tracker |
| onboardingCompletedAt | DateTime | Completion timestamp |
| createdAt | DateTime | Created timestamp |
| updatedAt | DateTime | Updated timestamp |


## Constraints

Unique:

```
email
```

---

# BusinessMember

## Purpose

Maps users to businesses.

Supports multiple users and multiple businesses.


Example:

```
John

    |
    |

Hospital A (Admin)

Consultancy B (Member)
```


## Schema

| Column | Type | Description |
|-|-|-|
| id | String | Primary key |
| userId | String | User reference |
| businessId | String | Business reference |
| role | Enum | Permission level |
| createdAt | DateTime | Created timestamp |
| updatedAt | DateTime | Updated timestamp |


---

# MemberRole Enum

Available roles:

```
OWNER

ADMIN

MEMBER
```


## Permission Mapping

### OWNER

Full business control


### ADMIN

Operational management


### MEMBER

Limited access

---

# AuditLog

## Purpose

Tracks important system activities.


Examples:

```
Business created

User invited

Settings changed

Record updated
```


## Schema

| Column | Type | Description |
|-|-|-|
| id | String | Primary key |
| action | String | Event name |
| entityType | String | Object type |
| entityId | String | Object identifier |
| actorId | String | User performing action |
| businessId | String | Related tenant |
| metadata | JSON | Additional data |
| createdAt | DateTime | Timestamp |

---

# 5. Tenant Isolation Strategy

## Rule

Every business-related query must be scoped using:

```
businessId
```


Example:

Correct:

```ts
prisma.branch.findMany({
  where: {
    businessId: userBusinessId
  }
})
```


Incorrect:

```ts
prisma.branch.findMany()
```


All future modules must include:

```
businessId
```

to maintain tenant separation.

---

# 6. Transaction Strategy

Critical operations use database transactions.


Example:

Initial onboarding:


```
BEGIN TRANSACTION


Create UserProfile

Create Business

Create BusinessMember

Create Branch

Create AuditLog


COMMIT
```


If any operation fails:

```
ROLLBACK
```

---

# 7. Index Strategy

## Business

```
industryTemplateId
```


## Branch

```
businessId
```


## BusinessMember

```
userId

businessId

(userId,businessId)
```


## AuditLog

```
entityType + entityId

actorId

businessId

createdAt
```

---

# 8. Future Database Expansion

Future industries will extend using separate domain tables.


Example:

## Healthcare Module

```
Patient

Doctor

Appointment

Prescription

Invoice
```


## Education Module

```
Student

Course

Application

Payment
```


## Restaurant Module

```
Menu

Order

Reservation

Inventory
```


Every module must maintain:

```
businessId
```

for tenant isolation.

---

# 9. Migration Strategy

Database changes follow:


```
Modify schema.prisma

        ↓

Create migration

        ↓

Review SQL

        ↓

Apply migration

        ↓

Update application logic
```


Development:

```bash
npx prisma migrate dev
```


Production:

```bash
npx prisma migrate deploy
```

---

# 10. Current Database Status

Completed:

✅ PostgreSQL setup  
✅ Prisma configuration  
✅ Core tenant schema  
✅ Authentication relationship  
✅ Onboarding transaction  


Next:

- Dashboard entities
- User preferences
- Permission tables
- Industry module tables
```