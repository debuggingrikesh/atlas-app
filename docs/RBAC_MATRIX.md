# RBAC Permission Matrix (Phase 1)

This document outlines the unified Role-Based Access Control (RBAC) behavior implemented across the frontend and backend of Project Atlas. 

## The Permission Resolver

All permissions are resolved using `resolvePermissions(membership)`. The rules are strictly defined as follows:

| Role Level | Behavior |
| --- | --- |
| **OWNER** | Full access to all business resources. `can()` always evaluates to `true`. |
| **ADMIN** | Granular permission-based access. `can(permissionKey)` evaluates to `true` if and only if the exact key exists in the role's assigned permissions. |
| **MEMBER** | Granular permission-based access. Operates identically to `ADMIN` but typically has fewer assigned permissions. |

## Feature Matrix

The following table summarizes default visibility and access rules for the standard roles.

### 1. Dashboard & Core Activity
| Resource | Permission Key Required | OWNER | ADMIN (Example) | MEMBER (Example) |
| --- | --- | --- | --- | --- |
| **Dashboard Home** | None (Auth + Membership) | ✅ Yes | ✅ Yes | ✅ Yes |
| **My Profile** | None (Auth + Membership) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Activity Timeline** | `activity.read` | ✅ Yes | ✅ Yes | ❌ No |

### 2. Business Settings
| Resource | Permission Key Required | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- | --- |
| **View Settings** | `business.read` | ✅ Yes | ✅ Yes | ❌ No |
| **Update Settings** | `business.update` | ✅ Yes | ✅ Yes | ❌ No |
| **Delete Business** | `business.delete` | ✅ Yes | ❌ No | ❌ No |

### 3. Branches
| Resource | Permission Key Required | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- | --- |
| **View Branches Page** | `branch.read` | ✅ Yes | ✅ Yes | ❌ No |
| **Create Branch** | `branch.create` | ✅ Yes | ✅ Yes | ❌ No |
| **Update Branch** | `branch.update` | ✅ Yes | ✅ Yes | ❌ No |

### 4. Roles & Permissions
| Resource | Permission Key Required | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- | --- |
| **View Roles Page** | `role.read` | ✅ Yes | ❌ No | ❌ No |
| **Manage Roles** | `role.manage` | ✅ Yes | ❌ No | ❌ No |

### 5. Team & Invitations
| Resource | Permission Key Required | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- | --- |
| **View Team Page** | `member.read` | ✅ Yes | ✅ Yes | ❌ No |
| **Invite Members** | `member.invite` | ✅ Yes | ✅ Yes | ❌ No |
| **Remove Members** | `member.remove` | ✅ Yes | ✅ Yes | ❌ No |

## Enforcement Layers

Project Atlas implements Defense in Depth. The RBAC rules are enforced at three distinct levels simultaneously:

1. **Frontend Navigation (`Sidebar.tsx`)**: Elements requiring specific permissions are completely unrendered for users lacking access.
2. **Page-Level Layout Guards (`src/app/(dashboard)/settings/*/page.tsx`)**: If a user attempts to manually navigate via URL to a route they lack permissions for, they are intercepted during Server Side Rendering and redirected back to the `/dashboard`.
3. **Backend API Endpoints (`src/app/api/**/*`)**: Every mutative action (POST, PATCH, DELETE) evaluates the user's DB-verified membership against `requirePermission(userId, businessId, key)` before performing any database transactions.
