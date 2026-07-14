# Project Atlas MVP QA Test Cases

## Test Case Format

ID:
Module:
Priority:
Preconditions:
Steps:
Expected Result:
Actual Result:
Status:
Notes:

---
## Authentication Test Cases

ID: AUTH-001
Module: Authentication
Priority: High
Preconditions: None
Steps: 1. Navigate to signup 2. Enter valid email/password 3. Submit
Expected Result: User is created in Supabase and UserProfile table
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-002
Module: Authentication
Priority: High
Preconditions: User exists
Steps: 1. Navigate to signup 2. Enter existing email 3. Submit
Expected Result: Error message displayed, no duplicate user created
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-003
Module: Authentication
Priority: Medium
Preconditions: None
Steps: 1. Navigate to signup 2. Enter valid email and weak password 3. Submit
Expected Result: Error message about password strength displayed
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-004
Module: Authentication
Priority: High
Preconditions: User exists
Steps: 1. Navigate to login 2. Enter valid credentials 3. Submit
Expected Result: Login successful, session created, redirected to app
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-005
Module: Authentication
Priority: High
Preconditions: User exists
Steps: 1. Navigate to login 2. Enter invalid password 3. Submit
Expected Result: Error message 'Invalid credentials' displayed
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-006
Module: Authentication
Priority: Medium
Preconditions: None
Steps: 1. Navigate to login 2. Enter unregistered email 3. Submit
Expected Result: Error message 'Invalid credentials' displayed
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-007
Module: Authentication
Priority: High
Preconditions: User logged in
Steps: 1. Click profile 2. Click logout
Expected Result: Session destroyed, redirected to login page
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-008
Module: Authentication
Priority: High
Preconditions: User logged in
Steps: 1. Reload page 2. Navigate across pages
Expected Result: User remains logged in
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-009
Module: Authentication
Priority: High
Preconditions: User logged out
Steps: 1. Navigate to /dashboard directly
Expected Result: Redirected to login page
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-010
Module: Authentication
Priority: Medium
Preconditions: User exists
Steps: 1. Click forgot password 2. Enter email 3. Submit
Expected Result: Reset email sent to the user
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-011
Module: Authentication
Priority: Medium
Preconditions: Reset token generated
Steps: 1. Click link in email 2. Enter new password 3. Submit
Expected Result: Password updated, user can login with new password
Actual Result: 
Status: 
Notes: 

---

## Onboarding Test Cases

ID: ONB-001
Module: Onboarding
Priority: High
Preconditions: New user, onboardingStep=1
Steps: 1. Login
Expected Result: Redirected to onboarding screen
Actual Result: 
Status: 
Notes: 

---

ID: ONB-002
Module: Onboarding
Priority: High
Preconditions: User on onboarding screen
Steps: 1. Enter fullName 2. Click next
Expected Result: Profile updated, onboardingStep advances
Actual Result: 
Status: 
Notes: 

---

ID: ONB-003
Module: Onboarding
Priority: Low
Preconditions: User on onboarding screen
Steps: 1. Upload image 2. Click next
Expected Result: Image uploaded to storage, avatarUrl updated
Actual Result: 
Status: 
Notes: 

---

ID: ONB-004
Module: Onboarding
Priority: Medium
Preconditions: User on onboarding optional step
Steps: 1. Click skip
Expected Result: Step skipped, onboarding continues
Actual Result: 
Status: 
Notes: 

---

ID: ONB-005
Module: Onboarding
Priority: High
Preconditions: User on onboarding screen
Steps: 1. Change URL to /dashboard
Expected Result: Redirected back to onboarding screen
Actual Result: 
Status: 
Notes: 

---

ID: ONB-006
Module: Onboarding
Priority: High
Preconditions: User at last step of onboarding
Steps: 1. Click finish
Expected Result: onboardingCompletedAt set, redirected to dashboard
Actual Result: 
Status: 
Notes: 

---

ID: ONB-007
Module: Onboarding
Priority: Medium
Preconditions: onboardingCompletedAt is set
Steps: 1. Navigate to /onboarding
Expected Result: Redirected to dashboard
Actual Result: 
Status: 
Notes: 

---

ID: ONB-008
Module: Onboarding
Priority: Medium
Preconditions: User on step 2 of onboarding
Steps: 1. Close browser 2. Login again
Expected Result: User resumes at onboarding step 2
Actual Result: 
Status: 
Notes: 

---

ID: ONB-009
Module: Onboarding
Priority: Low
Preconditions: User on profile step
Steps: 1. Enter special characters only 2. Submit
Expected Result: Validation error displayed
Actual Result: 
Status: 
Notes: 

---

ID: ONB-010
Module: Onboarding
Priority: High
Preconditions: User on business creation step
Steps: 1. Enter business details 2. Submit
Expected Result: Business created, user set as OWNER
Actual Result: 
Status: 
Notes: 

---

## Business Management Test Cases

ID: BUS-001
Module: Business Management
Priority: High
Preconditions: User onboarded
Steps: 1. Click Create Business 2. Fill details 3. Submit
Expected Result: Business created, user redirected to business dashboard
Actual Result: 
Status: 
Notes: 

---

ID: BUS-002
Module: Business Management
Priority: High
Preconditions: Business exists with slug 'abc'
Steps: 1. Create business with slug 'abc' 2. Submit
Expected Result: Validation error: slug already taken
Actual Result: 
Status: 
Notes: 

---

ID: BUS-003
Module: Business Management
Priority: Medium
Preconditions: Active templates exist
Steps: 1. Open business creation 2. Select template
Expected Result: Business created linked to industryTemplateId
Actual Result: 
Status: 
Notes: 

---

ID: BUS-004
Module: Business Management
Priority: Medium
Preconditions: Inactive template exists in DB
Steps: 1. Attempt to create business via API with inactive template ID
Expected Result: API returns 400 Bad Request
Actual Result: 
Status: 
Notes: 

---

ID: BUS-005
Module: Business Management
Priority: Medium
Preconditions: User is OWNER
Steps: 1. Go to settings 2. Update name 3. Save
Expected Result: Business name updated in DB and UI
Actual Result: 
Status: 
Notes: 

---

ID: BUS-006
Module: Business Management
Priority: Low
Preconditions: User is OWNER
Steps: 1. Upload new logo 2. Save
Expected Result: Logo URL updated and displayed
Actual Result: 
Status: 
Notes: 

---

ID: BUS-007
Module: Business Management
Priority: High
Preconditions: User is OWNER
Steps: 1. Click delete 2. Confirm
Expected Result: Business deleted, cascaded to members
Actual Result: 
Status: 
Notes: 

---

ID: BUS-008
Module: Business Management
Priority: High
Preconditions: User belongs to 2 businesses
Steps: 1. Click business switcher 2. Select second business
Expected Result: Context switches to second business
Actual Result: 
Status: 
Notes: 

---

ID: BUS-009
Module: Business Management
Priority: Medium
Preconditions: User is ADMIN/OWNER
Steps: 1. Go to branches 2. Click create 3. Fill details
Expected Result: Branch created under business
Actual Result: 
Status: 
Notes: 

---

ID: BUS-010
Module: Business Management
Priority: Low
Preconditions: User is ADMIN/OWNER
Steps: 1. Go to branches 2. Toggle isActive
Expected Result: Branch status updated
Actual Result: 
Status: 
Notes: 

---

## RBAC Test Cases

ID: RBAC-001
Module: RBAC
Priority: High
Preconditions: User is OWNER
Steps: 1. Access all settings 2. Perform destructive actions
Expected Result: All actions allowed
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-002
Module: RBAC
Priority: High
Preconditions: User is ADMIN
Steps: 1. Invite member 2. Update settings 3. Delete business
Expected Result: Invite/Update allowed, Delete denied
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-003
Module: RBAC
Priority: High
Preconditions: User is MEMBER
Steps: 1. View dashboard 2. Edit settings
Expected Result: View allowed, Edit denied
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-004
Module: RBAC
Priority: High
Preconditions: User is OWNER
Steps: 1. Attempt to delete 'OWNER' role via UI/API
Expected Result: Action rejected, isSystem=true protected
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-005
Module: RBAC
Priority: Medium
Preconditions: User is OWNER
Steps: 1. Go to roles 2. Create 'Manager' 3. Select permissions
Expected Result: Role created, RolePermission records created
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-006
Module: RBAC
Priority: Medium
Preconditions: User is OWNER
Steps: 1. Go to members 2. Change member role to 'Manager'
Expected Result: Member role updated, UI reflects new permissions
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-007
Module: RBAC
Priority: Medium
Preconditions: User is OWNER
Steps: 1. Delete 'Manager' role
Expected Result: Role deleted, cascaded/reassigned successfully
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-008
Module: RBAC
Priority: High
Preconditions: User is MEMBER
Steps: 1. Send POST request to /api/business/[id]/branches
Expected Result: API returns 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-009
Module: RBAC
Priority: Medium
Preconditions: User role changed
Steps: 1. Change role to ADMIN
Expected Result: Both 'role' enum and 'roleId' FK are updated in BusinessMember
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-010
Module: RBAC
Priority: Low
Preconditions: User is MEMBER
Steps: 1. Attempt to change another user's role
Expected Result: Action hidden in UI, blocked in API
Actual Result: 
Status: 
Notes: 

---

## Team Invitation Test Cases

ID: TEAM-001
Module: Team Invitation
Priority: High
Preconditions: User is ADMIN
Steps: 1. Go to team 2. Enter email 3. Select role 4. Submit
Expected Result: Invitation created (PENDING), email sent
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-002
Module: Team Invitation
Priority: Medium
Preconditions: Pending invite exists for email
Steps: 1. Send invite to same email
Expected Result: Error: Invitation already pending
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-003
Module: Team Invitation
Priority: Medium
Preconditions: User is already in business
Steps: 1. Send invite to member email
Expected Result: Error: User already a member
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-004
Module: Team Invitation
Priority: High
Preconditions: User has invitation link
Steps: 1. Click link 2. Complete signup
Expected Result: User registered, added to BusinessMember, invite ACCEPTED
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-005
Module: Team Invitation
Priority: High
Preconditions: User logged in, has invite
Steps: 1. Click link 2. Confirm
Expected Result: User added to BusinessMember, invite ACCEPTED
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-006
Module: Team Invitation
Priority: Medium
Preconditions: Invite expiresAt < now
Steps: 1. Click link
Expected Result: Error: Invitation expired
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-007
Module: Team Invitation
Priority: Medium
Preconditions: User is ADMIN
Steps: 1. Go to invites 2. Click cancel
Expected Result: Invite status changed to CANCELLED
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-008
Module: Team Invitation
Priority: Medium
Preconditions: Invite is CANCELLED
Steps: 1. Click link
Expected Result: Error: Invitation is no longer valid
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-009
Module: Team Invitation
Priority: High
Preconditions: User is MEMBER
Steps: 1. Attempt to call invite API
Expected Result: API returns 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-010
Module: Team Invitation
Priority: High
Preconditions: User is ADMIN
Steps: 1. Attempt to invite a new OWNER
Expected Result: Blocked: Cannot invite roles higher than own
Actual Result: 
Status: 
Notes: 

---

## Activity Timeline Test Cases

ID: ACT-001
Module: Activity Timeline
Priority: Medium
Preconditions: Business updated
Steps: 1. Update business name 2. Check timeline
Expected Result: AuditLog record created for UPDATE_BUSINESS
Actual Result: 
Status: 
Notes: 

---

ID: ACT-002
Module: Activity Timeline
Priority: Medium
Preconditions: Member invited
Steps: 1. Send invite 2. Check timeline
Expected Result: AuditLog record created for INVITE_MEMBER
Actual Result: 
Status: 
Notes: 

---

ID: ACT-003
Module: Activity Timeline
Priority: High
Preconditions: Action performed
Steps: 1. Inspect AuditLog DB record
Expected Result: actorId, entityType, entityId, businessId are correct
Actual Result: 
Status: 
Notes: 

---

ID: ACT-004
Module: Activity Timeline
Priority: Medium
Preconditions: Multiple actions performed
Steps: 1. View timeline UI
Expected Result: Events displayed in descending order by createdAt
Actual Result: 
Status: 
Notes: 

---

ID: ACT-005
Module: Activity Timeline
Priority: Low
Preconditions: System action occurs
Steps: 1. System performs background task 2. Check timeline
Expected Result: Event logged gracefully without actorId
Actual Result: 
Status: 
Notes: 

---

ID: ACT-006
Module: Activity Timeline
Priority: Medium
Preconditions: Action with metadata performed
Steps: 1. Inspect AuditLog DB record
Expected Result: Metadata JSON contains expected changed fields
Actual Result: 
Status: 
Notes: 

---

ID: ACT-007
Module: Activity Timeline
Priority: Low
Preconditions: 50+ events exist
Steps: 1. View timeline 2. Scroll/Click next
Expected Result: Older events load correctly
Actual Result: 
Status: 
Notes: 

---

ID: ACT-008
Module: Activity Timeline
Priority: High
Preconditions: User in Business A
Steps: 1. View timeline
Expected Result: No events from Business B appear
Actual Result: 
Status: 
Notes: 

---

ID: ACT-009
Module: Activity Timeline
Priority: Medium
Preconditions: Member role updated
Steps: 1. Change member role 2. Check timeline
Expected Result: Event captures old and new role
Actual Result: 
Status: 
Notes: 

---

ID: ACT-010
Module: Activity Timeline
Priority: Medium
Preconditions: Branch created
Steps: 1. Create branch 2. Check timeline
Expected Result: Event logged for CREATE_BRANCH
Actual Result: 
Status: 
Notes: 

---

## Notification Test Cases

ID: NOTIF-001
Module: Notification
Priority: High
Preconditions: User invited to Business
Steps: 1. Target user logs in 2. Checks notifications
Expected Result: Notification for 'Team Invitation' appears
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-002
Module: Notification
Priority: Medium
Preconditions: User role changed
Steps: 1. Target user logs in
Expected Result: Notification for 'Role Updated' appears
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-003
Module: Notification
Priority: High
Preconditions: User has unread notification
Steps: 1. Click notification
Expected Result: readAt timestamp is set, UI shows as read
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-004
Module: Notification
Priority: Medium
Preconditions: Multiple unread notifications
Steps: 1. Click 'Mark all as read'
Expected Result: All notifications for user get readAt set
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-005
Module: Notification
Priority: High
Preconditions: Action triggers notification
Steps: 1. Verify DB
Expected Result: Notification created only for intended userId and businessId
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-006
Module: Notification
Priority: High
Preconditions: User A checks notifications
Steps: 1. Query API
Expected Result: User A cannot see User B's notifications
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-007
Module: Notification
Priority: Low
Preconditions: Notification created
Steps: 1. Inspect DB record
Expected Result: metadata JSON contains link/action context
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-008
Module: Notification
Priority: Low
Preconditions: User has read notification
Steps: 1. Click dismiss
Expected Result: Notification removed from view (soft/hard delete depending on implementation)
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-009
Module: Notification
Priority: Low
Preconditions: Target user online
Steps: 1. Trigger notification
Expected Result: UI updates without page reload (if implemented)
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-010
Module: Notification
Priority: Medium
Preconditions: User belongs to 2 businesses
Steps: 1. Switch business
Expected Result: Only notifications for current business are shown
Actual Result: 
Status: 
Notes: 

---

## Multi-Tenant Isolation Test Cases

ID: TENANT-001
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User in Business A
Steps: 1. Paste Business B URL
Expected Result: 404 Not Found or 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-002
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User in Business A
Steps: 1. Call API with Business B ID
Expected Result: API returns 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-003
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User in Business A
Steps: 1. Fetch branches
Expected Result: Only Business A branches returned
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-004
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User in Business A
Steps: 1. API call to update Business B member
Expected Result: Rejected
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-005
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User in Business A
Steps: 1. Fetch roles via API
Expected Result: Only Business A roles returned
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-006
Module: Multi-Tenant Isolation
Priority: Medium
Preconditions: User fetches Industry Templates
Steps: 1. Call templates API
Expected Result: Allowed (global resource)
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-007
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User has invite token for Business B
Steps: 1. Use token 2. Access Business B
Expected Result: Access granted ONLY to business B context
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-008
Module: Multi-Tenant Isolation
Priority: High
Preconditions: User sends modified JWT/Session cookie
Steps: 1. Tamper session data
Expected Result: Signature validation fails, session rejected
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-009
Module: Multi-Tenant Isolation
Priority: Medium
Preconditions: Query resource without businessId
Steps: 1. Developer test API call
Expected Result: Backend explicitly requires businessId context
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-010
Module: Multi-Tenant Isolation
Priority: High
Preconditions: Delete Business A
Steps: 1. Delete A
Expected Result: Business B data is completely untouched
Actual Result: 
Status: 
Notes: 

---

## Security Test Cases

ID: SEC-001
Module: Security
Priority: High
Preconditions: User in Business A
Steps: 1. PUT request to Branch ID from Business B
Expected Result: 403/404 Error
Actual Result: 
Status: 
Notes: 

---

ID: SEC-002
Module: Security
Priority: High
Preconditions: User A logged in
Steps: 1. GET /api/users/[User B ID]
Expected Result: 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: SEC-003
Module: Security
Priority: High
Preconditions: User is MEMBER
Steps: 1. PUT request to change own roleId to OWNER
Expected Result: 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: SEC-004
Module: Security
Priority: Medium
Preconditions: Attacker script
Steps: 1. Send 50 login requests in 1 minute
Expected Result: 429 Too Many Requests
Actual Result: 
Status: 
Notes: 

---

ID: SEC-005
Module: Security
Priority: Medium
Preconditions: Attacker script
Steps: 1. Send 100 invites rapidly
Expected Result: 429 Too Many Requests
Actual Result: 
Status: 
Notes: 

---

ID: SEC-006
Module: Security
Priority: High
Preconditions: User creates business
Steps: 1. Enter `<script>alert(1)</script>`
Expected Result: Input sanitized, script not executed in UI
Actual Result: 
Status: 
Notes: 

---

ID: SEC-007
Module: Security
Priority: High
Preconditions: User searches branches
Steps: 1. Enter `'; DROP TABLE Branch;--`
Expected Result: Input escaped, DB intact
Actual Result: 
Status: 
Notes: 

---

ID: SEC-008
Module: Security
Priority: High
Preconditions: User logged in
Steps: 1. Submit form from external domain
Expected Result: Request blocked, missing CSRF token / SameSite rules apply
Actual Result: 
Status: 
Notes: 

---

ID: SEC-009
Module: Security
Priority: High
Preconditions: User modifies session cookie
Steps: 1. Change userId in cookie
Expected Result: Server rejects tampered cookie
Actual Result: 
Status: 
Notes: 

---

ID: SEC-010
Module: Security
Priority: High
Preconditions: User fetches own profile
Steps: 1. Inspect network response
Expected Result: Password hashes and auth tokens are NOT in payload
Actual Result: 
Status: 
Notes: 

---

## Database Integrity Test Cases

ID: DB-001
Module: Database Integrity
Priority: High
Preconditions: Business has branches, roles
Steps: 1. Delete business 2. Check DB
Expected Result: Branches, Roles, Members deleted automatically
Actual Result: 
Status: 
Notes: 

---

ID: DB-002
Module: Database Integrity
Priority: High
Preconditions: User has memberships
Steps: 1. Delete user 2. Check DB
Expected Result: Memberships and Notifications deleted
Actual Result: 
Status: 
Notes: 

---

ID: DB-003
Module: Database Integrity
Priority: High
Preconditions: Email exists
Steps: 1. DB insert duplicate email
Expected Result: Postgres throws UniqueConstraintViolation
Actual Result: 
Status: 
Notes: 

---

ID: DB-004
Module: Database Integrity
Priority: High
Preconditions: Slug exists
Steps: 1. DB insert duplicate slug
Expected Result: Postgres throws UniqueConstraintViolation
Actual Result: 
Status: 
Notes: 

---

ID: DB-005
Module: Database Integrity
Priority: High
Preconditions: Missing required field
Steps: 1. DB insert without name
Expected Result: Postgres throws NullConstraintViolation
Actual Result: 
Status: 
Notes: 

---

ID: DB-006
Module: Database Integrity
Priority: Medium
Preconditions: Role created
Steps: 1. Insert role without businessId
Expected Result: Postgres throws ForeignKeyViolation
Actual Result: 
Status: 
Notes: 

---

ID: DB-007
Module: Database Integrity
Priority: Medium
Preconditions: Token exists
Steps: 1. Insert duplicate tokenHash
Expected Result: Postgres throws UniqueConstraintViolation
Actual Result: 
Status: 
Notes: 

---

ID: DB-008
Module: Database Integrity
Priority: Medium
Preconditions: Branch deleted
Steps: 1. Delete branch
Expected Result: Check if related branch data (if any) is handled
Actual Result: 
Status: 
Notes: 

---

ID: DB-009
Module: Database Integrity
Priority: High
Preconditions: User in business
Steps: 1. Insert duplicate userId-businessId pair
Expected Result: Postgres throws UniqueConstraintViolation
Actual Result: 
Status: 
Notes: 

---

ID: DB-010
Module: Database Integrity
Priority: High
Preconditions: Role 'Manager' exists in Bus A
Steps: 1. Create 'Manager' in Bus A
Expected Result: Postgres throws UniqueConstraintViolation
Actual Result: 
Status: 
Notes: 

---

## Authentication Additional Test Cases

ID: AUTH-011
Module: Authentication Additional
Priority: High
Preconditions: User registered but unverified
Steps: 1. Login with unverified email
Expected Result: Login blocked or redirected to verification screen
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-012
Module: Authentication Additional
Priority: Medium
Preconditions: User logged in on Device A
Steps: 1. Login on Device B 2. Perform action on Device A
Expected Result: Both sessions remain active, or strict single-session policy enforced based on configuration
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-013
Module: Authentication Additional
Priority: High
Preconditions: User account marked as deactivated
Steps: 1. Attempt to login
Expected Result: Login rejected with clear 'Deactivated' message
Actual Result: 
Status: 
Notes: 

---

## RBAC Additional Test Cases

ID: RBAC-011
Module: RBAC Additional
Priority: High
Preconditions: User role changed by ADMIN
Steps: 1. Target user performs action requiring old role
Expected Result: Action denied immediately, verifying cache invalidation
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-012
Module: RBAC Additional
Priority: Medium
Preconditions: ADMIN downgraded to MEMBER
Steps: 1. Target user attempts to access ADMIN settings
Expected Result: Access denied, UI updates to hide settings
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-013
Module: RBAC Additional
Priority: High
Preconditions: User is the only OWNER
Steps: 1. Attempt to delete own account or leave business
Expected Result: Action blocked, must transfer ownership first
Actual Result: 
Status: 
Notes: 

---

ID: RBAC-014
Module: RBAC Additional
Priority: High
Preconditions: User is MEMBER
Steps: 1. Send raw POST request to restricted endpoint
Expected Result: API returns 403 Forbidden independent of UI state
Actual Result: 
Status: 
Notes: 

---

## Multi-Tenant Additional Test Cases

ID: TENANT-011
Module: Multi-Tenant Additional
Priority: High
Preconditions: API request made
Steps: 1. Call API without businessId header/param
Expected Result: Request fails with 400 Bad Request if context is required
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-012
Module: Multi-Tenant Additional
Priority: High
Preconditions: Server component loads
Steps: 1. Verify DB queries in log
Expected Result: All Prisma queries explicitly include `where: { businessId }`
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-013
Module: Multi-Tenant Additional
Priority: High
Preconditions: Next.js Server Action executed
Steps: 1. Submit form for Business A while active in Business B
Expected Result: Action rejected due to context mismatch
Actual Result: 
Status: 
Notes: 

---

ID: TENANT-014
Module: Multi-Tenant Additional
Priority: Medium
Preconditions: Job queue processing
Steps: 1. Enqueue job for Business A
Expected Result: Job strictly runs under Business A context without leaking to B
Actual Result: 
Status: 
Notes: 

---

## Team Invitation Additional Test Cases

ID: TEAM-011
Module: Team Invitation Additional
Priority: Low
Preconditions: Invite already ACCEPTED
Steps: 1. Attempt to CANCEL invite
Expected Result: Action fails, invite status remains ACCEPTED
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-012
Module: Team Invitation Additional
Priority: Medium
Preconditions: User in Business A
Steps: 1. Accept invite to Business B
Expected Result: User successfully added to Business B without losing Business A access
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-013
Module: Team Invitation Additional
Priority: High
Preconditions: Invite already ACCEPTED
Steps: 1. Click invite link again
Expected Result: Error: Invitation has already been used
Actual Result: 
Status: 
Notes: 

---

## Activity Timeline Additional Test Cases

ID: ACT-011
Module: Activity Timeline Additional
Priority: High
Preconditions: Action fails validation
Steps: 1. Perform invalid business update
Expected Result: No AuditLog record is created for the failed action
Actual Result: 
Status: 
Notes: 

---

ID: ACT-012
Module: Activity Timeline Additional
Priority: High
Preconditions: Database error during action
Steps: 1. Trigger DB error mid-transaction
Expected Result: AuditLog record is rolled back with the transaction
Actual Result: 
Status: 
Notes: 

---

ID: ACT-013
Module: Activity Timeline Additional
Priority: High
Preconditions: User updates profile password
Steps: 1. Inspect AuditLog metadata
Expected Result: Password hash and sensitive PII are excluded from metadata
Actual Result: 
Status: 
Notes: 

---

## Notification Additional Test Cases

ID: NOTIF-011
Module: Notification Additional
Priority: Medium
Preconditions: Multiple notifications arrive
Steps: 1. View notification dropdown
Expected Result: Notifications sorted strictly by createdAt descending
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-012
Module: Notification Additional
Priority: Low
Preconditions: Notifications > 30 days old
Steps: 1. Check DB
Expected Result: Old read notifications are pruned or archived
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-013
Module: Notification Additional
Priority: High
Preconditions: Notification fails to insert
Steps: 1. Trigger notification with missing relation
Expected Result: Primary action (e.g. invite) still succeeds or fails atomically based on design
Actual Result: 
Status: 
Notes: 

---

## Database Additional Test Cases

ID: DB-011
Module: Database Additional
Priority: Medium
Preconditions: New migration applied
Steps: 1. Run prisma migrate down (if supported)
Expected Result: Schema reverts without data corruption
Actual Result: 
Status: 
Notes: 

---

ID: DB-012
Module: Database Additional
Priority: High
Preconditions: Two users edit same resource
Steps: 1. User A and User B save at exact same time
Expected Result: One succeeds, other receives conflict/stale data error
Actual Result: 
Status: 
Notes: 

---

ID: DB-013
Module: Database Additional
Priority: High
Preconditions: Multiple rapid clicks
Steps: 1. Click 'Create' button rapidly 5 times
Expected Result: Only one resource created, duplicate requests blocked
Actual Result: 
Status: 
Notes: 

---


ID: AUTH-014
Module: Authentication Additional
Priority: High
Preconditions: Active user exists
Steps: 1. Login 2. Verify dashboard access
Expected Result: Login successful, access granted
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-015
Module: Authentication Additional
Priority: High
Preconditions: User is logged in
Steps: 1. Admin deactivates user account 2. User attempts to load protected API route
Expected Result: API returns 403 Forbidden with 'deactivated' message
Actual Result: 
Status: 
Notes: 

---

ID: AUTH-016
Module: Authentication Additional
Priority: High
Preconditions: User is deactivated
Steps: 1. Admin calls /api/admin/users/[id]/status with isActive: true 2. User logs in
Expected Result: Reactivation successful, login successful
Actual Result: 
Status: 
Notes: 

---

ID: ONB-011
Module: Onboarding Additional
Priority: High
Preconditions: New user starts onboarding
Steps: 1. Complete step 1 2. Close browser 3. Log back in
Expected Result: User is restored to step 2 with previous data populated
Actual Result: 
Status: 
Notes: 

---

ID: ONB-012
Module: Onboarding Additional
Priority: Medium
Preconditions: User on onboarding screen
Steps: 1. Call POST /api/onboarding/draft with draft payload
Expected Result: DB reflects onboardingData and onboardingStep updates immediately
Actual Result: 
Status: 
Notes: 

---

ID: ONB-013
Module: Onboarding Additional
Priority: Medium
Preconditions: User has draft data, then completes onboarding
Steps: 1. Complete onboarding fully 2. Check DB
Expected Result: onboardingData is null, onboardingCompletedAt is set
Actual Result: 
Status: 
Notes: 

---

ID: ONB-014
Module: Onboarding Additional
Priority: Low
Preconditions: User at business creation step
Steps: 1. Enter "$%^&*()" as business name 2. Submit
Expected Result: Rejected by validation (Must contain alphanumeric)
Actual Result: 
Status: 
Notes: 

---

ID: BUS-011
Module: Business Management Additional
Priority: High
Preconditions: User is OWNER
Steps: 1. Delete business 2. Confirm
Expected Result: Business is soft deleted, 200 OK
Actual Result: 
Status: 
Notes: 

---

ID: BUS-012
Module: Business Management Additional
Priority: High
Preconditions: User is ADMIN or MEMBER
Steps: 1. Attempt to delete business
Expected Result: 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: BUS-013
Module: Business Management Additional
Priority: High
Preconditions: Business is deleted
Steps: 1. Fetch businesses via GET /api/business
Expected Result: Deleted business does not appear in list
Actual Result: 
Status: 
Notes: 

---

ID: BUS-014
Module: Business Management Additional
Priority: High
Preconditions: Business is deleted
Steps: 1. View audit logs for user
Expected Result: 'business.deleted' event exists
Actual Result: 
Status: 
Notes: 

---

ID: BUS-015
Module: Business Management Additional
Priority: High
Preconditions: User creating business
Steps: 1. Pass non-existent template ID
Expected Result: 400 Bad Request
Actual Result: 
Status: 
Notes: 

---

ID: BUS-016
Module: Business Management Additional
Priority: High
Preconditions: User creating business
Steps: 1. Pass inactive template ID
Expected Result: 400 Bad Request
Actual Result: 
Status: 
Notes: 

---

ID: BUS-017
Module: Business Management Additional
Priority: Medium
Preconditions: User is OWNER/ADMIN
Steps: 1. Update business with valid logoUrl
Expected Result: 200 OK, logo updated in DB
Actual Result: 
Status: 
Notes: 

---

ID: BUS-018
Module: Business Management Additional
Priority: Medium
Preconditions: User is OWNER/ADMIN
Steps: 1. Update business with invalid logoUrl (e.g. "not-a-url")
Expected Result: 400 Bad Request
Actual Result: 
Status: 
Notes: 

---

ID: BUS-019
Module: Business Management Additional
Priority: Medium
Preconditions: User is MEMBER
Steps: 1. Attempt to update business logoUrl
Expected Result: 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-014
Module: Team Invitation Additional
Priority: Medium
Preconditions: User is MEMBER
Steps: 1. Attempt to cancel an invitation
Expected Result: 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

ID: TEAM-015
Module: Team Invitation Additional
Priority: High
Preconditions: User is ADMIN of Business A
Steps: 1. Attempt to cancel an invitation belonging to Business B
Expected Result: 403 Forbidden or 404 Not Found
Actual Result: 
Status: 
Notes: 

---

ID: ACT-014
Module: Activity Timeline Additional
Priority: High
Preconditions: Admin logs in
Steps: 1. Update member role to ADMIN 2. Check timeline
Expected Result: Event "member.role_updated" logged with correct newRole and previousRole
Actual Result: 
Status: 
Notes: 

---

ID: ACT-015
Module: Activity Timeline Additional
Priority: Medium
Preconditions: Admin logs in
Steps: 1. Attempt to upgrade someone to OWNER
Expected Result: 403 Forbidden (Only OWNER can grant OWNER)
Actual Result: 
Status: 
Notes: 

---

ID: ACT-016
Module: Activity Timeline Additional
Priority: High
Preconditions: Last OWNER logs in
Steps: 1. Attempt to demote self to ADMIN
Expected Result: 400 Bad Request (Cannot change role of last remaining owner)
Actual Result: 
Status: 
Notes: 

---

ID: ACT-017
Module: Activity Timeline Additional
Priority: High
Preconditions: Admin of Business A logs in
Steps: 1. Attempt to update member role in Business B
Expected Result: 404 Not Found
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-014
Module: Notification Additional
Priority: High
Preconditions: User belongs to Business A
Steps: 1. Send GET request with businessId=BusinessA
Expected Result: Returns only notifications for Business A
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-015
Module: Notification Additional
Priority: High
Preconditions: User belongs to Business A and B
Steps: 1. Send GET request with businessId=BusinessA
Expected Result: Does not return any notifications from Business B
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-016
Module: Notification Additional
Priority: High
Preconditions: User does not belong to Business C
Steps: 1. Send GET request with businessId=BusinessC
Expected Result: 403 Forbidden or 404 Not Found (requirePermission block)
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-017
Module: Notification Additional
Priority: Medium
Preconditions: Member exists
Steps: 1. Update member role to ADMIN
Expected Result: Affected member receives a notification stating their role was updated
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-018
Module: Notification Additional
Priority: High
Preconditions: Role is updated
Steps: 1. Check notifications of actor and other members
Expected Result: Only the member whose role was changed receives the notification
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-019
Module: Notification Additional
Priority: High
Preconditions: Role is updated
Steps: 1. Check cross-tenant feed
Expected Result: Notification strictly tied to the businessId where the role was updated
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-020
Module: Notification Additional
Priority: Medium
Preconditions: User has 5 unread notifications in Business A
Steps: 1. Call PATCH /api/notifications/read-all with businessId=BusinessA
Expected Result: Returns count=5, all 5 notifications marked read
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-021
Module: Notification Additional
Priority: High
Preconditions: User has unread notifications in Business A and B
Steps: 1. Call read-all for Business A
Expected Result: Business B notifications remain unread
Actual Result: 
Status: 
Notes: 

---

ID: NOTIF-022
Module: Notification Additional
Priority: High
Preconditions: User not in Business C
Steps: 1. Call read-all for Business C
Expected Result: 403 Forbidden
Actual Result: 
Status: 
Notes: 

---

---

ID: DB-014
Module: Database Additional
Priority: High
Preconditions: Same business loaded twice
Steps: 1. A and B fetch same Business. A submits update.
Expected Result: A succeeds.
Actual Result: 
Status: 
Notes: 

---

ID: DB-015
Module: Database Additional
Priority: High
Preconditions: Same business loaded twice
Steps: 1. A and B fetch same Business. A submits update. B submits update with original version.
Expected Result: B receives 409 Conflict.
Actual Result: 
Status: 
Notes: 

---

ID: DB-016
Module: Database Additional
Priority: High
Preconditions: Business is updated
Steps: 1. Check version in DB
Expected Result: version incremented by 1
Actual Result: 
Status: 
Notes: 

---

## Email Delivery Test Cases

ID: EMAIL-001
Module: Email Delivery
Priority: High
Preconditions: Resend configured
Steps: 1. Create team invitation
Expected Result: Email sent to invitee, invitation created
Actual Result: 
Status: 
Notes: 

---

ID: EMAIL-002
Module: Email Delivery
Priority: High
Preconditions: Pending invitation exists
Steps: 1. Click resend invitation
Expected Result: Email sent to invitee, rawToken hidden in production
Actual Result: 
Status: 
Notes: 

---

ID: EMAIL-003
Module: Email Delivery
Priority: High
Preconditions: Resend configured incorrectly or failing
Steps: 1. Create or resend invitation
Expected Result: Invitation state remains valid, API returns 500 EMAIL_FAILED
Actual Result: 
Status: 
Notes: 

---

ID: EMAIL-004
Module: Email Delivery
Priority: High
Preconditions: Production environment (NODE_ENV=production)
Steps: 1. Create invitation 2. Check API response
Expected Result: rawToken is absent from API response
Actual Result: 
Status: 
Notes: 
