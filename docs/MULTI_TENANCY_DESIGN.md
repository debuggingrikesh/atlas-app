# MULTI_TENANCY_DESIGN.md

# Atlas Multi-Tenancy Design

## 1. Purpose

This document defines the multi-tenant architecture for Atlas.

Atlas is designed as a SaaS platform where multiple businesses can use the same application infrastructure while maintaining strict data isolation.

The multi-tenancy system is responsible for:

- Business isolation
- Tenant identification
- Data access boundaries
- User-business relationships
- Permission enforcement
- Future enterprise scaling

---

# 2. Multi-Tenant Architecture Overview

Atlas follows a shared infrastructure, shared database, tenant-isolated model.

Architecture:

```
                 Atlas Platform

                       |
        --------------------------------
        |              |               |
        v              v               v

   Business A     Business B      Business C

        |              |               |

    Users          Users          Users

        |              |               |

    Data           Data           Data
```

All businesses share:

- Application code
- Database instance
- Authentication system
- Infrastructure

But their data remains logically isolated.

---

# 3. Multi-Tenancy Strategy

Atlas uses:

## Shared Database

Single PostgreSQL database.

## Shared Schema

All tenant-aware tables exist inside the same schema.

## Tenant Identifier

Every tenant-owned record is connected through:

```
businessId
```

Example:

```prisma
model Branch {
  id         String @id @default(cuid())
  businessId String

  business Business @relation(
    fields: [businessId],
    references: [id]
  )
}
```

---

# 4. Core Tenant Entity

The tenant entity in Atlas is:

```
Business
```

Database model:

```prisma
model Business {
  id                 String @id @default(cuid())
  name               String
  slug               String @unique
  industryTemplateId String

  branches Branch[]
  members  BusinessMember[]
}
```

A Business represents:

- Company
- Organization
- Institution
- Clinic
- School
- Enterprise account

---

# 5. Tenant Hierarchy

Atlas follows this structure:

```
Platform

 |
 |
 v

Business

 |
 |
 +----------------+
 |                |
 v                v

Branches       Members

 |
 |
 v

Business Data
```

Example:

```
Atlas
 |
 +-- VXL Education
 |       |
 |       +-- Kathmandu Branch
 |       +-- Butwal Branch
 |
 +-- ABC Hospital
         |
         +-- Main Branch
```

---

# 6. User and Tenant Relationship

Users do not directly belong to one business.

Instead:

```
User

 |

BusinessMember

 |

Business
```

This allows:

- Multiple business memberships
- Consultants managing multiple clients
- Enterprise organizations

---

Example:

```
User Rikesh

 |
 +---- DebugDream
 |        OWNER
 |
 |
 +---- Client Company
          ADMIN
```

---

# 7. Tenant Context Resolution

Every authenticated request requires tenant context.

Tenant context can come from:

## Method 1: User Membership

Default MVP approach.

Flow:

```
User Login

      |

Fetch BusinessMember

      |

Resolve Active Business

      |

Execute Request
```

---

## Method 2: URL Based Tenant

Future support:

```
atlas.com/business-slug/dashboard
```

Example:

```
vxl.atlas.com
```

---

## Method 3: Custom Domains

Enterprise future:

```
app.customer-domain.com
```

---

# 8. Active Business Selection

A user may belong to multiple businesses.

Atlas maintains:

```
Current Active Business
```

Example:

```
Logged in as:

Rikesh

Current Workspace:

DebugDream
```

Switch:

```
DebugDream
        |
        v
Client Company
```

---

Future implementation:

```
UserSession

{
 activeBusinessId:
 "business_xxxxx"
}
```

---

# 9. Database Isolation Rules

Every tenant-owned table must contain:

```
businessId
```

Examples:

Required:

```
Branch
Customer
Invoice
Appointment
Employee
Transaction
```

---

Non-tenant tables:

```
UserProfile
IndustryTemplate
SystemConfiguration
```

---

# 10. Query Isolation Pattern

Every query must include tenant filtering.

Incorrect:

```ts
prisma.customer.findMany()
```

---

Correct:

```ts
prisma.customer.findMany({
 where:{
   businessId
 }
})
```

---

Rule:

No tenant-owned data query without businessId.

---

# 11. Service Layer Pattern

Tenant context should flow through services.

Example:

```ts
createCustomer({
 businessId,
 name,
 phone
})
```

Not:

```ts
createCustomer({
 name,
 phone
})
```

---

The service layer is responsible for:

- Tenant validation
- Permission checks
- Database operations

---

# 12. Middleware Responsibility

The proxy layer handles:

```
Authentication
+
Session Validation
```

It does not directly handle:

```
Business permissions
```

---

Flow:

```
Request

 |

Proxy

 |

Authenticated User

 |

Application Layer

 |

Tenant Resolver

 |

Authorization

 |

Database Query
```

---

# 13. Tenant Security Model

Security boundaries:

```
User

cannot access

Business

unless

BusinessMember exists
```

---

Validation:

```text
User ID
     |
     |
BusinessMember
     |
     |
Business ID
```

---

# 14. Business Roles

Each tenant controls its own permissions.

Initial roles:

```
OWNER
ADMIN
MEMBER
```

Example:

Business A:

```
User 1 = OWNER
User 2 = ADMIN
```

Business B:

```
User 1 = MEMBER
```

Same user, different permissions.

---

# 15. Tenant Creation Flow

New business creation:

```
User completes onboarding

        |

Create Business

        |

Create Branch

        |

Create BusinessMember

        |

Assign OWNER role

        |

Create AuditLog
```

All operations happen inside:

```
Database Transaction
```

---

# 16. Tenant Lifecycle

## Creation

```
Signup

+

Onboarding

=

New Tenant
```

---

## Active

```
Business
 |
 Users
 |
 Data
```

---

## Future States

```
Trial

Active

Suspended

Archived
```

---

# 17. Future Scaling Strategy

Current:

```
Shared Database
Shared Schema
```

---

Future:

## Large Enterprise Tenants

Possible migration:

```
Business A

Own Database
```

---

## Hybrid Model

Small businesses:

```
Shared Database
```

Enterprise:

```
Dedicated Database
```

---

# 18. Tenant-Aware Modules

Every future module must support:

```
Business Context
```

Examples:

## CRM

```
Customer
businessId
```

## HR

```
Employee
businessId
```

## Finance

```
Invoice
businessId
```

## Healthcare

```
Patient
businessId
```

---

# 19. Development Rules

Every developer must:

1. Never query tenant data without businessId
2. Never trust client-provided businessId
3. Always verify membership
4. Keep tenant logic in service layer
5. Use transactions for tenant creation
6. Log important tenant actions

---

# 20. Multi-Tenancy Roadmap

## Phase 1

Completed:

- Business model
- BusinessMember model
- Branch model
- Role foundation

---

## Phase 2

Next:

- Active business switching
- Tenant context provider
- Permission middleware
- Tenant-aware services

---

## Phase 3

Enterprise:

- Custom domains
- Organization hierarchy
- Dedicated databases
- Advanced isolation

---

# Conclusion

Atlas uses a scalable multi-tenant SaaS architecture.

The Business entity represents the tenant boundary.

Users access business data only through explicit memberships.

This design allows Atlas to support small businesses today while maintaining a path toward enterprise SaaS architecture.