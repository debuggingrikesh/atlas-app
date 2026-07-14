# Project Atlas QA Execution Tracker

Version:
Tester:
Environment:
Date Started:

---

## Summary

Total Test Cases: 123
Passed: 33
Failed: 2
Blocked:
Not Tested: 1

Pass Percentage: 91.67%

---

# Execution Log

## Authentication

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|
| AUTH-014 | Active user login | Passed | | |
| AUTH-015 | Deactivated user API rejection | Passed | | |
| AUTH-016 | Reactivation flow | Passed | | |

---

## Onboarding

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Business Management

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## RBAC

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Team Invitation

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Activity Timeline

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Notification

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Multi-Tenant Isolation

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Security

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Database Integrity

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Authentication Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## RBAC Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Multi-Tenant Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Team Invitation Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Activity Timeline Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Notification Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

---

## Database Additional

| ID | Test Case | Status | Bug ID | Notes |
|---|---|---|---|---|

## Onboarding

| ID | Description | Status | Bug ID | Notes |
|---|---|---|---|---|
| ONB-001 | Redirected to onboarding screen | Passed | | |
| ONB-002 | Profile updated, onboardingStep advances | Passed | | (Client-side state) |
| ONB-003 | Image uploaded to storage, avatarUrl updated | Untested | | Requires UI/Storage review |
| ONB-004 | Step skipped, onboarding continues | Passed | | (Client-side state) |
| ONB-005 | Change URL to /dashboard -> Redirected back | Passed | | Enforced by layout middleware |
| ONB-006 | Click finish -> completedAt set | Passed | | |
| ONB-007 | Navigate to /onboarding -> Redirect to dashboard | Passed | | |
| ONB-008 | Resume at onboarding step 2 | Passed | | Fixed by BUG-ONB-001 |
| ONB-009 | Special characters only -> Validation error | Passed | | Fixed by BUG-ONB-002 |
| ONB-010 | Business created, user set as OWNER | Passed | | Handled transactionally |
| ONB-011 | Resume onboarding | Passed | | |
| ONB-012 | Draft persistence | Passed | | |
| ONB-013 | Draft cleanup after completion | Passed | | |
| ONB-014 | Invalid name rejection | Passed | | |

## Business Management

| ID | Description | Status | Bug ID | Notes |
|---|---|---|---|---|
| BUS-001 | Create Business | Passed | | Works via createBusiness |
| BUS-002 | Business exists with slug abc -> Validation error | Passed | | System auto-appends -1 instead of throwing error |
| BUS-003 | Select template -> linked | Passed | | |
| BUS-004 | Inactive template -> 400 | Passed | | Fixed by BUG-BUS-001 |
| BUS-005 | Update name | Passed | | |
| BUS-006 | Upload new logo | Failed | BUG-BUS-002 | logoUrl not supported in API or schema |
| BUS-007 | Delete business | Passed | | Replaced by soft delete (BUS-011) |
| BUS-008 | Switch business context | Passed | | GET /api/business returns list |
| BUS-009 | Create branch | Passed | | |
| BUS-010 | Update branch status | Failed | BUG-BUS-004 | PATCH endpoint for branch does not exist |
| BUS-011 | Delete business (OWNER) | Passed | | |
| BUS-012 | Delete business (ADMIN/MEMBER) | Passed | | Blocked by requirePermission |
| BUS-013 | Fetch deleted business | Passed | | Filtered out by get-user-businesses |
| BUS-014 | View audit logs | Passed | | Logs "business.deleted" |
| BUS-015 | Non-existent template -> 400 | Passed | | |
| BUS-016 | Inactive template -> 400 | Passed | | |
| BUS-017 | Valid logoUrl update | Passed | | Fixed by BUG-BUS-002 |
| BUS-018 | Invalid logoUrl update -> 400 | Passed | | |
| BUS-019 | Unauthorized logoUrl update -> 403 | Passed | | |

---

# Bug Summary

| Bug ID | Severity | Module | Status |
|---|---|---|---|
| BUG-AUTH-001 | Medium | Authentication | Open |
| BUG-AUTH-002 | High | Authentication | Resolved |
| BUG-ONB-001 | High | Onboarding | Resolved |
| BUG-ONB-002 | Low | Onboarding | Resolved |
| BUG-BUS-001 | Medium | Business Management | Resolved |
| BUG-BUS-002 | Low | Business Management | Resolved |
| BUG-BUS-003 | High | Business Management | Resolved |
| BUG-BUS-004 | Low | Business Management | Open |
| BUG-INV-001 | High | Team Invitation | Resolved |
| BUG-ACT-001 | High | Activity Timeline | Resolved |
| BUG-NOT-001 | Medium | Notification | Resolved |
| BUG-NOT-002 | Medium | Notification | Resolved |
| BUG-NOT-003 | Low | Notification | Open |
| BUG-NOT-004 | High | Notification | Resolved |
| BUG-NOT-005 | Low | Notification | Open |
| BUG-DB-001 | High | Database Integrity | Open |
| BUG-DB-002 | Medium | Database Integrity | Open |

Severity:
- Critical
- High
- Medium
- Low

---

# QA Signoff

Functional Testing:
Security Testing:
Regression Testing:

Final Status:
- Approved
- Approved with Issues
- Failed
