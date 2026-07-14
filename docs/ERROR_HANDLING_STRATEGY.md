# ERROR_HANDLING_STRATEGY.md

# Project Atlas Error Handling Strategy

Version: 1.0  
Status: Engineering Standard  
Document Type: Application Reliability Architecture  
Last Updated: July 2026

---

# 1. Purpose

This document defines the error handling architecture for Project Atlas.

The objective is to create a consistent system for:

- Detecting errors
- Handling failures safely
- Communicating problems to users
- Logging useful debugging information
- Protecting sensitive information
- Maintaining system reliability

All application layers must follow this strategy.

---

# 2. Error Handling Principles

## 2.1 Fail Predictably

Every failure should have:

- Known error type
- Clear response
- Appropriate logging
- Recovery path

---

## 2.2 Never Expose Internal Details

Users should never see:

- Database errors
- Stack traces
- Internal paths
- Secret information

Example:

Bad:


PrismaClientKnownRequestError:
Unique constraint failed on User.email


Good:


An account with this email already exists.


---

## 2.3 Errors Are Part of Architecture

Errors should be designed like:

- APIs
- Database models
- Components

They must be consistent across the platform.

---

# 3. Error Categories

Project Atlas uses the following error hierarchy:


Application Error

|

|

Validation Error

Authentication Error

Authorization Error

Resource Error

Database Error

External Service Error

System Error


---

# 4. Application Error Model

All custom errors should extend a base application error.

Example:

```ts
class AppError extends Error {
  code: string
  statusCode: number

  constructor(
    message:string,
    code:string,
    statusCode:number
  ){
    super(message)

    this.code = code
    this.statusCode = statusCode
  }
}
5. Standard Error Codes

Project Atlas uses predictable error codes.

Example:

AUTH_REQUIRED

AUTH_INVALID

PERMISSION_DENIED

VALIDATION_FAILED

RESOURCE_NOT_FOUND

RESOURCE_EXISTS

DATABASE_ERROR

INTERNAL_ERROR
6. HTTP Status Mapping
Error Type	Status
Validation Error	400
Authentication Error	401
Authorization Error	403
Not Found	404
Conflict	409
Rate Limit	429
Server Error	500
7. API Error Response Format

All APIs return:

Success
{
 "success": true,
 "data": {}
}
Error
{
 "success": false,
 "error": {
   "code":"VALIDATION_FAILED",
   "message":"Invalid input",
   "details":[]
 }
}
8. API Error Flow

Every API request follows:

Request

↓

Authentication Check

↓

Input Validation

↓

Authorization Check

↓

Business Logic

↓

Database Operation

↓

Response

Errors are captured at every stage.

9. Validation Errors

Validation failures happen when:

Missing fields
Invalid formats
Incorrect values

Example:

Input:

{
 "email":"invalid"
}

Response:

{
 "success":false,
 "error":{
   "code":"VALIDATION_FAILED",
   "message":"Invalid email format"
 }
}
10. Authentication Errors

Authentication errors include:

Missing session
Expired session
Invalid token
Failed login

Example:

{
 "success":false,
 "error":{
  "code":"AUTH_REQUIRED",
  "message":"Please login"
 }
}
11. Authorization Errors

Authorization errors occur when:

User lacks permission
Wrong business access
Wrong role

Example:

MEMBER

tries

OWNER action

Response:

{
 "code":"PERMISSION_DENIED"
}
12. Multi-Tenant Error Handling

Tenant isolation errors must never reveal data.

Bad:

Business ABC does not exist

Good:

Resource not found

Example:

User attempts:

Business A User

requests

Business B Customer

System returns:

RESOURCE_NOT_FOUND
13. Database Error Handling

Database errors must be translated.

Never return raw Prisma errors.

Example:

Database:

Unique constraint violation

Converted:

RESOURCE_EXISTS
14. Prisma Error Mapping

Common mappings:

Prisma Error	Application Error
P2002	RESOURCE_EXISTS
P2025	RESOURCE_NOT_FOUND
P2003	VALIDATION_FAILED
15. Transaction Error Handling

Critical workflows use transactions.

Example:

Onboarding:

Create UserProfile

↓

Create Business

↓

Create Branch

↓

Create Member

If failure:

Rollback Everything

Transaction errors must:

Rollback
Log details
Return safe response
16. Service Layer Error Rules

Services should:

Throw application errors
Not return raw database errors

Example:

Bad:

return prisma.business.create()

Good:

try {

 return await prisma.business.create()

}

catch(error){

 throw new DatabaseError()

}
17. Frontend Error Handling

Frontend should handle:

Loading states
Empty states
Error states
Retry states

Example:

API Failure:

Request Failed

↓

Display Friendly Message

↓

Allow Retry
18. Form Error Handling

Forms should show:

Field errors:

Email already exists

Not:

Request failed

Validation errors should map:

API Error

↓

Field Message

↓

User Correction
19. Toast Notification Standards

Use toast messages for:

Temporary feedback.

Examples:

Success:

Business created successfully

Error:

Unable to save changes

Avoid:

Long technical messages.

20. Global Error Boundary

Frontend requires:

Component Error

↓

Error Boundary

↓

Fallback UI

Example:

Something went wrong.

Try refreshing the page.
21. Logging Strategy

Every server error should log:

Timestamp

User ID

Business ID

Request ID

Error Code

Stack Trace

Never log:

Passwords
Tokens
Personal secrets
22. Development vs Production Errors
Development

Allowed:

Detailed logs
Stack traces
Debug information
Production

Allowed:

User-safe messages
Error IDs
Monitoring data
23. Error Monitoring

Production should track:

Error frequency
Failed requests
Slow operations
Database failures

Recommended future integration:

Application

↓

Error Monitoring Service

↓

Alerts
24. Retry Strategy

Retry automatically only for:

Temporary failures
Network issues
External service failures

Do not retry:

Validation errors
Permission errors
Invalid requests
25. External Service Errors

Examples:

Supabase
Payment providers
Email services
Third-party APIs

Handling:

External Failure

↓

Capture Error

↓

Fallback Response

↓

Log Details
26. Rate Limit Errors

When limits are exceeded:

Return:

{
 "code":"RATE_LIMIT_EXCEEDED",
 "message":"Too many requests"
}
27. Security Error Rules

Never reveal:

Whether another user exists
Internal database structure
Permission details

Example:

Bad:

User exists but belongs to another company

Good:

Resource unavailable
28. AI Development Rules

AI-generated code must:

Always:

Use existing error classes
Follow API response format
Handle failures explicitly
Add proper logging

Never:

Add console.log debugging permanently
Expose raw errors
Ignore catch blocks
29. Error Handling Checklist

Before merging:

[ ] Errors have proper codes

[ ] API responses follow standard format

[ ] Database errors are mapped

[ ] Tenant errors are protected

[ ] User messages are friendly

[ ] Logs contain useful context

[ ] No sensitive data exposed
30. Future Improvements

Planned:

Central error package
Automatic error reporting
Advanced alerting
Error analytics dashboard
AI-powered debugging assistant