# UAT Fix Round 2

## Overview
This document outlines the frontend gaps identified during UAT Round 2 and their corresponding fixes.

## Issues & Fixes

### 1. Root Homepage Redirects
**Issue**: The root route (`/`) redirected all unauthenticated users to `/login` and authenticated users to `/settings/profile`, missing a proper landing page experience and a logical dashboard entry point.
**Root Cause**: The original `src/app/page.tsx` was implemented as a simple redirection layer for MVP.
**Files Changed**:
- `src/app/page.tsx`
**Fix**: 
- Added a full SaaS landing page for unauthenticated users featuring branding, a subtitle, and Login/Create Account buttons.
- Updated authenticated logic to dynamically resolve the user's active business and redirect them to `/dashboard/[businessSlug]`. If no profile or business is found, they are redirected to `/onboarding/step/1`.

### 2. Invitation Signup Flow Bug
**Issue**: After an invited user successfully signed up, they were redirected directly to the invitation acceptance screen (`/invitations/[token]`), but the backend returned a 400 Bad Request. 
**Root Cause**: The user's `UserProfile` (which requires a `fullName`) was never created. The onboarding flow was bypassed completely.
**Files Changed**:
- `src/modules/auth/components/SignupForm.tsx`
- `src/modules/auth/components/onboarding/OnboardingWizard.tsx`
- `src/modules/auth/components/onboarding/Step1ProfileForm.tsx`
**Fix**: 
- `SignupForm` now routes to `/onboarding/step/1` while preserving the `returnTo` token.
- `OnboardingWizard` now intercepts step 1 submission if a `returnTo` query parameter is present. It creates a profile skeleton by sending a POST to `/api/onboarding/draft`, updates the full name via `PATCH /api/users/profile`, and immediately redirects the user to the invitation acceptance screen.

### 3. Branch Management UI
**Issue**: Missing UI for editing and toggling active status on branches.
**Root Cause**: The initial iteration only supported listing and creating branches.
**Files Verified**:
- `src/app/(dashboard)/settings/branches/BranchActions.tsx`
- `src/app/api/business/[businessId]/branches/[branchId]/route.ts`
**Fix**: 
- Validated that the `BranchActions` component is successfully wired up, allowing users with `branch.update` permissions to edit branch details and toggle active/inactive status inline.

### 4. Profile Avatar UX
**Issue**: Profile page only accepted manual Avatar URL inputs.
**Root Cause**: Lack of direct file upload integration.
**Files Changed**:
- `src/modules/auth/components/ProfileForm.tsx`
**Fix**: 
- Replaced the URL text input with a hidden file input and an image preview.
- Integrated Supabase Storage (`avatars` bucket) for direct file uploads up to 1MB (JPG, PNG, WEBP).
- Form automatically saves the resulting public URL to the `UserProfile`.

### 5. Roles Management UI
**Issue**: The roles page only displayed permissions, lacking a way to reassign roles.
**Root Cause**: Initial MVP constraints.
**Files Verified**:
- `src/modules/team/components/TeamMemberList.tsx`
- `src/modules/team/lib/update-member-role.ts`
**Fix**: 
- Verified that `TeamMemberList.tsx` correctly restricts the role dropdown to `OWNER`, `ADMIN`, and `MEMBER` based on the actor's permissions.
- Validated the existing `PATCH` API correctly enforces hierarchy logic (e.g., preventing demotion of the last owner).

## Verification
All changes can be manually verified by walking through the following steps:
1. Load `/` unauthenticated to view the new landing page.
2. Sign up via an invitation link, verify the routing to `/onboarding/step/1`, and ensure successful profile creation before accepting the invite.
3. Access Profile Settings to upload a local image as an avatar.
4. Manage branch settings via inline edit and toggle buttons.
5. Manage team roles and assert role reassignment limits.
