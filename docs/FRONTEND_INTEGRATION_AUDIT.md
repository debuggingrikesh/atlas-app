# Frontend Integration Audit - Project Atlas

This document outlines the state of frontend integration compared against the fully implemented backend API modules, generated during the UAT phase.

## 1. Authentication
* **Status**: Complete
* **UI Page Implemented**: Yes (`/login`, `/signup`, `/auth/verify-email`)
* **Route Implemented**: Yes
* **Navigation Exists**: Yes
* **Connected to Backend**: Yes
* **Functional**: Yes
* **Missing**: None.

## 2. User Profile
* **Status**: Partially Integrated
* **UI Page Implemented**: Yes (`/settings/profile`)
* **Route Implemented**: Yes
* **Navigation Exists**: No (Missing sidebar navigation from Dashboard)
* **Connected to Backend**: Yes (`/api/users/profile`)
* **Functional**: Yes, but inaccessible without typing the URL manually.
* **Missing**: Sidebar navigation links.

## 3. Onboarding
* **Status**: Complete
* **UI Page Implemented**: Yes (`/onboarding/step/[step]`)
* **Route Implemented**: Yes
* **Navigation Exists**: Yes (Automated flow)
* **Connected to Backend**: Yes
* **Functional**: Yes
* **Missing**: None.

## 4. Dashboard
* **Status**: Partially Integrated
* **UI Page Implemented**: Yes (`/dashboard/[businessSlug]`)
* **Route Implemented**: Yes
* **Navigation Exists**: Missing almost entirely. The top nav only has a Notification icon and Sign out button.
* **Connected to Backend**: Yes
* **Functional**: Yes
* **Missing**: 
  - Sidebar layout to navigate between Business settings, Team, Activity, Profile, etc.
  - Business switcher dropdown.

## 5. Business Management
* **Status**: Backend Only
* **UI Page Implemented**: No (`/settings/business` is missing)
* **Route Implemented**: No
* **Navigation Exists**: No
* **Connected to Backend**: No
* **Functional**: No
* **Missing**: 
  - Complete UI for updating business details (Name, Logo, Description).
  - Integration with `PATCH /api/business/[businessId]`.

## 6. Branches
* **Status**: Backend Only
* **UI Page Implemented**: No
* **Route Implemented**: No
* **Navigation Exists**: No
* **Connected to Backend**: No
* **Functional**: No
* **Missing**: 
  - `BranchManagement` UI components (List, Create, Update, Delete).
  - `/settings/branches` settings page.

## 7. Team Members
* **Status**: Partially Integrated
* **UI Page Implemented**: Yes (`/settings/team`)
* **Route Implemented**: Yes
* **Navigation Exists**: No (Missing from Dashboard)
* **Connected to Backend**: Yes
* **Functional**: Yes
* **Missing**: Dashboard Sidebar navigation.

## 8. Invitations
* **Status**: Partially Integrated
* **UI Page Implemented**: Yes for creation (`InviteMemberModal`), **NO** for acceptance.
* **Route Implemented**: No frontend route for users to accept (`/invitations/[token]` is missing).
* **Navigation Exists**: No
* **Connected to Backend**: Create/Cancel works. Accept is disconnected.
* **Functional**: Create works. Accepting is impossible via UI.
* **Missing**: 
  - `/invitations/[token]/page.tsx` (Public acceptance page).
  - Integration with `POST /api/invitations/[id]/accept`.

## 9. RBAC (Role-Based Access Control)
* **Status**: Backend Only
* **UI Page Implemented**: No
* **Route Implemented**: No
* **Navigation Exists**: No
* **Connected to Backend**: No
* **Functional**: No
* **Missing**: 
  - Custom Role creator UI (name, description, permissions selection).
  - `/settings/roles` page.

## 10. Activity Timeline
* **Status**: Partially Integrated
* **UI Page Implemented**: Yes (`/settings/activity`)
* **Route Implemented**: Yes
* **Navigation Exists**: No
* **Connected to Backend**: Yes
* **Functional**: Yes
* **Missing**: Dashboard Sidebar navigation.

## 11. Notifications
* **Status**: Partially Integrated
* **UI Page Implemented**: Yes (`NotificationBell.tsx`, `NotificationDropdown.tsx`)
* **Route Implemented**: N/A (Component based)
* **Navigation Exists**: Yes (Top Nav)
* **Connected to Backend**: **Broken** (Incompatible with recent backend changes)
* **Functional**: No. Yields `400 Bad Request`.
* **Missing**: 
  - `Mark All As Read` UI button integration with `PATCH /api/notifications/read-all`.
* **Incompatible API Calls**:
  - **Frontend**: `GET /api/notifications?limit=20`
  - **Backend**: Requires `businessId` query param.
  - **Exact Fix**: Update `NotificationBell.tsx` to receive `businessId` as a React Prop (passed down from `DashboardLayout`). Then update fetches to ``fetch(`/api/notifications?businessId=${businessId}&limit=20`)``.

## 12. Settings
* **Status**: Partially Integrated
* **UI Page Implemented**: Routes exist but lack a cohesive layout shell.
* **Route Implemented**: Yes (`/settings/*`)
* **Navigation Exists**: No
* **Connected to Backend**: Yes
* **Functional**: Yes
* **Missing**: `<SettingsLayout>` to group `Profile`, `Business`, `Team`, `Branches`, and `Activity` with a sidebar menu.

---

## Prioritized Implementation Plan

### Priority 1: Release Blockers
* **Notifications Fix**: Fix the `NotificationBell` 400 Bad Request by plumbing `businessId` into the API fetch. Without this, the UI visibly fails on load.
* **Invitation Acceptance UI**: Create `src/app/invitations/[token]/page.tsx` so invited users actually have a landing page to accept the token, wiring it to `POST /api/invitations/[id]/accept`.

### Priority 2: Core UX
* **Dashboard Shell & Navigation**: Create a persistent `Sidebar` component within `src/app/(dashboard)/layout.tsx` linking to Dashboard, Team, Activity, and Profile.
* **Settings Layout**: Create a nested `src/app/(dashboard)/settings/layout.tsx` to cleanly route between Business, Branches, Team, Roles, and Profile.

### Priority 3: Enhancements
* **Business Management UI**: Build `src/app/(dashboard)/settings/business/page.tsx` to wire up the OCC `update-business` endpoint.
* **Branches Management UI**: Build the Branch creation/editing componentry.
* **RBAC Roles UI**: Build the Role Management table and permission toggle UI.
* **Mark All As Read**: Wire the new bulk read notification endpoint into the dropdown header.
