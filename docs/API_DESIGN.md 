# Project Atlas API Design

Version: 1.0  
Status: Active Development  
Architecture: Next.js App Router + Route Handlers  
Database: PostgreSQL  
ORM: Prisma v7  

---

# 1. API Overview

Project Atlas follows a modular API architecture.

API responsibilities:

- Authentication handling
- Input validation
- Business logic execution
- Database operations
- Permission enforcement
- Audit logging


Architecture:

```
Client

 |

API Route Handler

 |

Validation Layer

 |

Service Layer

 |

Prisma ORM

 |

PostgreSQL
```

---

# 2. API Design Principles

## REST-based Structure

APIs follow resource-oriented naming.

Example:

```
GET    /api/businesses
POST   /api/businesses
GET    /api/businesses/:id
PATCH  /api/businesses/:id
DELETE /api/businesses/:id
```

---

## Server-side Validation

All external input must be validated.

Technology:

```
Zod
```

Example:

```ts
const schema = z.object({
  name: z.string().min(2)
})
```

---

## Authentication Required

Protected APIs require:

```
Supabase authenticated session
```

Flow:

```
Request

↓

Validate session

↓

Get UserProfile

↓

Check BusinessMember permission

↓

Execute action
```

---

# 3. API Folder Structure

Current:

```
src/app/api/

├── auth/
│
├── onboarding/
│
├── industry/
│
└── business/
```

Future:

```
src/app/api/

├── healthcare/

├── education/

├── restaurant/

├── billing/

└── analytics/
```

---

# 4. Authentication APIs

---

# POST /api/auth/signup

## Purpose

Create a new user account.


Request:

```json
{
 "email":"user@example.com",
 "password":"password",
 "fullName":"John Doe"
}
```


Process:

```
Receive credentials

↓

Create Supabase Auth user

↓

Create session

↓

Redirect onboarding
```


Response:

```json
{
 "success":true,
 "message":"Account created"
}
```

---

# POST /api/auth/login

## Purpose

Authenticate existing users.


Request:

```json
{
 "email":"user@example.com",
 "password":"password"
}
```


Response:

```json
{
 "success":true
}
```

---

# GET /api/auth/me

## Purpose

Return current authenticated user information.


Response:

```json
{
 "user":{
   "id":"",
   "email":"",
   "businesses":[]
 }
}
```

---

# 5. Onboarding APIs

---

# POST /api/onboarding/complete

## Purpose

Complete initial tenant setup.


Creates:

```
UserProfile

Business

BusinessMember

Branch

AuditLog
```


Uses:

```
Prisma Transaction
```


Flow:

```
Validate session

↓

Validate onboarding payload

↓

Create UserProfile

↓

Create Business

↓

Create Membership

↓

Create Branch

↓

Create AuditLog

↓

Return dashboard URL
```


Request:

```json
{
 "fullName":"John Doe",
 "businessName":"ABC Hospital",
 "industryTemplateId":"clxxx",
 "branchName":"Kathmandu",
 "address":"Kathmandu Nepal"
}
```


Response:

```json
{
 "success":true,
 "redirect":"/dashboard/abc-hospital"
}
```

---

# 6. Industry APIs

---

# GET /api/industry/templates

## Purpose

Return available industry templates.


Response:

```json
[
 {
  "id":"",
  "name":"Healthcare",
  "slug":"healthcare"
 }
]
```

---

# 7. Business APIs

---

# GET /api/business

## Purpose

Return businesses accessible by current user.


Response:

```json
[
 {
  "id":"",
  "name":"",
  "role":"OWNER"
 }
]
```

---

# POST /api/business

## Purpose

Create additional business.


Permission:

```
OWNER
```

---

# GET /api/business/:id

## Purpose

Return business details.


Validation:

User must belong to business.

---

# PATCH /api/business/:id

## Purpose

Update business settings.


Allowed:

```
OWNER
ADMIN
```

---

# DELETE /api/business/:id

## Purpose

Delete business.


Permission:

```
OWNER
```

---

# 8. Branch APIs

---

# GET /api/business/:id/branches

Returns:

```
Business branches
```

---

# POST /api/business/:id/branches

Creates:

```
New branch
```

Permission:

```
OWNER
ADMIN
```

---

# 9. Permission System

Every protected action follows:

```
Authenticated User

↓

BusinessMember lookup

↓

Role validation

↓

Execute operation
```


Roles:

---

## OWNER

Full business control.

---

## ADMIN

Management access.

---

## MEMBER

Operational access.

---

# 10. Error Handling

Standard response format:


```json
{
 "success":false,
 "error":{
   "code":"VALIDATION_ERROR",
   "message":"Invalid input"
 }
}
```


Common error codes:

```
UNAUTHORIZED

FORBIDDEN

NOT_FOUND

VALIDATION_ERROR

DATABASE_ERROR
```

---

# 11. Audit Logging

Important mutations create AuditLog records.


Example:

```
PATCH /api/business/:id

↓

Update database

↓

Create audit record
```


Audit example:

```json
{
 "action":"BUSINESS_UPDATED",
 "entityType":"Business",
 "entityId":"",
 "actorId":"",
 "businessId":""
}
```

---

# 12. Future Module APIs

Industry modules follow:

## Healthcare

```
/api/healthcare/patients

/api/healthcare/doctors

/api/healthcare/appointments
```


## Education

```
/api/education/students

/api/education/applications
```


## Restaurant

```
/api/restaurant/orders

/api/restaurant/menu
```

---

# 13. API Security Rules

Never expose:

```
DATABASE_URL

SUPABASE_SERVICE_ROLE_KEY
```


Every mutation must:

```
Authenticate

↓

Authorize

↓

Validate

↓

Execute

↓

Audit
```

---

# 14. Development Rules

Before adding API:


Checklist:

```
[ ] Define resource

[ ] Create validation schema

[ ] Add permission rules

[ ] Add service function

[ ] Add database operation

[ ] Add audit logging

[ ] Add tests
```

---

# 15. Current API Status

Completed:

✅ Signup API  
✅ Login API  
✅ Auth session API  
✅ Industry templates API  
✅ Onboarding completion API  


Next:

- Dashboard APIs
- Business settings APIs
- User management APIs
- Industry module APIs