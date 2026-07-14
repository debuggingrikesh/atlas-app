# UAT Round 3 Fix

## Overview
This document outlines the root causes, files changed, and verification steps for the frontend issues discovered during UAT Round 3.

## Issues & Fixes

### 1. Invitation Signup Payload Error
**Problem:**
When signing up via an invitation link, the backend API returned a `400 Bad Request` with `"Invalid input: expected string, received null"` because the `email` field was missing from the POST payload.

**Root Cause:**
In `SignupForm.tsx`, when a user navigated to the page via an invitation link, their `initialEmail` was pre-populated, which caused the visible `<Input />` field to be marked with `disabled`. In HTML standard form submission, disabled fields are explicitly omitted from the serialized `FormData`. Therefore, the `email` value was dropped entirely when the React Action triggered, causing the backend validation to fail since `null` was sent instead of the email string.

**Files Changed:**
- `src/modules/auth/components/SignupForm.tsx`

**Fix:**
Added a hidden input containing the `initialEmail` value right above the disabled visible input. This guarantees that the pre-populated email is serialized and sent to the `/api/auth/signup` backend while keeping the visible UI locked down.

### 2. Branch Management Actions Missing
**Problem:**
On the `Settings -> Branches` page, the "Edit" and "Activate/Deactivate" buttons were completely missing, despite being correctly implemented in the `BranchActions` component.

**Root Cause:**
The permission hooks (`requirePermission.ts` and the inline checks in the branch page) evaluated the user's `branch.update` rights by querying the new RBAC `RolePermission` schema via `membership.rbacRole`. However, the application is currently in a dual-write transition phase where new members might lack an `rbacRole` ID initially (falling back to a legacy `MemberRole` enum column such as `OWNER`). Since their `rbacRole` was `null`, the logic falsely evaluated `canEdit` to `false`, effectively hiding the buttons.

**Files Changed:**
- `src/app/(dashboard)/settings/branches/page.tsx`
- `src/lib/auth/require-permission.ts`

**Fix:**
Modified the authorization checks in both the UI (`page.tsx`) and the backend `PATCH` route (`requirePermission.ts`) to gracefully fall back to checking the legacy `membership.role` enum (`OWNER` or `ADMIN`) during the transition period if their `rbacRole` has not yet been populated.

## Verification Steps
1. **Signup Validation:**
   - Generate an invitation for a new email.
   - Open the invitation link in an incognito window.
   - Enter a password and submit.
   - Verify that the API succeeds and you are immediately redirected to the Name step, followed by the invitation acceptance page without encountering any 400 Bad Request errors.
2. **Branch Permissions Verification:**
   - Log in as the `OWNER` of a business.
   - Navigate to **Settings -> Branches**.
   - Verify that the **Edit (pencil)** and **Activate/Deactivate** buttons appear in the "Actions" column.
   - Attempt to toggle the status of a branch and verify the backend allows the request (200 OK) without rejecting it with a 403 Forbidden error.
