# PERMISSION_SYSTEM_DESIGN.md

# Atlas Permission System Design

## 1. Purpose

This document defines the authorization and permission architecture for Atlas.

Authentication answers:

```
Who is the user?
```

Authorization answers:

```
What can the user do?
```

Atlas separates these systems to create a scalable permission model suitable for a multi-tenant SaaS platform.

The permission system controls:

- User access
- Business-level permissions
- Resource actions
- API authorization
- UI visibility
- Future custom roles

---

# 2. Permission Architecture Overview

Atlas follows a Role-Based Access Control (RBAC) model.

Architecture:

```
User

 |

BusinessMember

 |

Role

 |

Permissions

 |

Allowed Actions
```

Example:

```
Rikesh

 |
OWNER

 |
Business Management Permission

 |
Can create branches
```

---

# 3. Current Permission Model

Atlas starts with predefined roles:

```
OWNER
ADMIN
MEMBER
```

Each role contains a predefined set of permissions.

---

# 4. Role Definitions

## OWNER

Highest business authority.

Responsibilities:

- Full business control
- Manage users
- Manage billing
- Delete business
- Configure settings

Permissions:

```
*
```

---

## ADMIN

Business operator.

Responsibilities:

- Manage daily operations
- Manage users
- Modify business data

Restrictions:

- Cannot delete business
- Cannot transfer ownership

---

## MEMBER

Standard user.

Responsibilities:

- Access assigned business resources
- Perform allowed operations

Restrictions:

- No administrative control

---

# 5. Role Hierarchy

```
OWNER

  |
  v

ADMIN

  |
  v

MEMBER
```

Permission inheritance:

```
OWNER
 |
 +-- ADMIN
       |
       +-- MEMBER
```

---

# 6. Permission Structure

Permissions follow:

```
RESOURCE.ACTION
```

Format:

```
resource.permission
```

Examples:

```
business.update

branch.create

member.invite

customer.view

invoice.create
```

---

# 7. Core Permission Groups

## Business Permissions

```
business.view

business.update

business.delete

business.settings
```

---

## Member Permissions

```
member.view

member.invite

member.update

member.remove
```

---

## Branch Permissions

```
branch.view

branch.create

branch.update

branch.delete
```

---

## Data Permissions

Future modules:

```
customer.view

customer.create

customer.update

customer.delete
```

---

# 8. Permission Matrix

Initial system:

| Permission | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| View Business | Yes | Yes | Yes |
| Update Business | Yes | Yes | No |
| Delete Business | Yes | No | No |
| Invite Members | Yes | Yes | No |
| Remove Members | Yes | Yes | No |
| Create Branch | Yes | Yes | No |
| View Data | Yes | Yes | Yes |
| Modify Data | Yes | Yes | Limited |

---

# 9. Database Design

## Current Implementation

Permissions are mapped internally.

Current model:

```
BusinessMember

    |

role

    |

Permission Rules
```

---

Future scalable model:

```
User

 |

BusinessMember

 |

Role

 |

RolePermission

 |

Permission
```

---

Future Prisma structure:

```prisma
model Role {
 id String @id
 name String
 permissions RolePermission[]
}


model Permission {
 id String @id
 name String
}


model RolePermission {
 roleId String
 permissionId String
}
```

---

# 10. Authorization Flow

Every protected action follows:

```
Request

 |

Authenticate User

 |

Resolve Business Context

 |

Find Membership

 |

Check Role

 |

Check Permission

 |

Allow / Reject
```

---

# 11. Backend Authorization

Permissions must always be enforced server-side.

Example:

```ts
await requirePermission({
 businessId,
 userId,
 permission:"branch.create"
})
```

---

Never rely only on:

- Frontend hiding buttons
- Client state
- URL protection

---

# 12. API Authorization Pattern

Example:

```
POST /api/business/branch
```

Flow:

```
Receive Request

      |

Authenticate User

      |

Get Business ID

      |

Check:

branch.create

      |

Execute Action
```

---

Unauthorized response:

```json
{
 "success":false,
 "error":{
   "code":"FORBIDDEN",
   "message":"Insufficient permissions"
 }
}
```

---

# 13. Frontend Permission Handling

Frontend permissions improve UX only.

Example:

```
IF user.can("branch.create")

SHOW

Create Branch Button
```

---

Frontend must never replace backend checks.

---

# 14. Permission Helper System

Recommended helpers:

```
can()

hasRole()

requirePermission()

requireRole()
```

Example:

```ts
can(
 user,
 "member.invite"
)
```

Returns:

```
true / false
```

---

# 15. Business Ownership Rules

Only OWNER can:

```
Transfer ownership

Delete business

Change subscription

Manage security settings
```

---

ADMIN cannot:

```
Delete business

Remove owner

Transfer ownership
```

---

# 16. Multiple Business Permissions

A user may have different roles per business.

Example:

```
User A

Business X
OWNER

Business Y
MEMBER
```

Permission evaluation always requires:

```
userId

+

businessId
```

---

# 17. Future Custom Roles

Enterprise requirement:

Allow businesses to create custom roles.

Example:

```
Hospital Manager

Finance Officer

HR Manager
```

Architecture supports:

```
Custom Role

      |

Selected Permissions

      |

Assigned Users
```

---

# 18. Permission Audit Logging

Sensitive permission changes must create AuditLogs.

Examples:

```
OWNER changed ADMIN role

ADMIN invited user

OWNER transferred ownership
```

Audit:

```json
{
 action:"ROLE_UPDATED",
 entityType:"BusinessMember",
 entityId:"xxx"
}
```

---

# 19. Security Rules

Rules:

1. Never trust client permissions
2. Always verify membership
3. Always include business context
4. Check permissions before database mutations
5. Log security-sensitive actions

---

# 20. Implementation Roadmap

## Phase 1

Completed foundation:

- BusinessMember role field
- OWNER/ADMIN/MEMBER roles

---

## Phase 2

Implementation:

- Permission constants
- Authorization helpers
- API guards
- Frontend permission hooks

---

## Phase 3

Advanced:

- Custom roles
- Permission builder UI
- Enterprise policies
- Attribute-based access control

---

# Conclusion

Atlas uses a scalable RBAC authorization system.

The BusinessMember relationship is the foundation.

Roles define user capability.

Permissions define allowed actions.

This architecture allows Atlas to evolve from a simple SaaS MVP into an enterprise-grade multi-tenant platform.