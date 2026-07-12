# FRONTEND_ARCHITECTURE.md

# Atlas Frontend Architecture Design

## 1. Purpose

This document defines the frontend architecture for Atlas.

Atlas uses a scalable frontend structure designed for a multi-tenant SaaS platform.

The frontend architecture focuses on:

- Maintainable code organization
- Clear separation of responsibilities
- Performance optimization
- Developer scalability
- Consistent UI patterns
- Secure client/server boundaries

---

# 2. Frontend Technology Stack

Atlas frontend uses:

## Framework

```
Next.js 16
(App Router)
```

---

## Language

```
TypeScript
```

---

## Styling

```
Tailwind CSS
```

---

## UI Components

```
Base UI
+
Custom Design System
```

---

## Forms

```
React Hook Form
+
Zod Validation
```

---

## Data Layer

```
Server Components
+
Server Actions
+
API Routes
```

---

# 3. Frontend Architecture Philosophy

Atlas follows:

```
Feature-Based Architecture
```

Instead of:

```
Component-Based Folder Dump
```

---

Structure:

```
Feature

 |
 +-- Components

 |
 +-- Hooks

 |
 +-- Actions

 |
 +-- Services

 |
 +-- Validators
```

---

# 4. Application Structure

Recommended structure:

```
src/

├── app/
│
├── modules/
│
├── components/
│
├── hooks/
│
├── lib/
│
├── types/
│
├── constants/
│
└── styles/
```

---

# 5. App Router Structure

```
app/

├── (public)

│   ├── page.tsx
│   ├── login
│   └── signup


├── (onboarding)

│   ├── layout.tsx
│   └── step


├── (dashboard)

│   ├── layout.tsx
│   └── dashboard


├── api/

└── auth/
```

---

# 6. Route Groups

Atlas uses Next.js route groups.

Purpose:

- Different layouts
- Cleaner routing
- Better organization

Example:

```
(public)

(no authentication)


(onboarding)

(authentication required)


(dashboard)

(authentication + business context)
```

---

# 7. Component Architecture

Atlas separates components into three levels.

---

# 7.1 UI Components

Reusable design system components.

Example:

```
Button

Input

Modal

Card

Dropdown
```

Location:

```
src/components/ui
```

---

# 7.2 Feature Components

Business-specific components.

Example:

```
BusinessCard

BranchForm

MemberTable
```

Location:

```
src/modules/business/components
```

---

# 7.3 Page Components

Route-specific composition.

Example:

```
dashboard/page.tsx
```

Responsibilities:

- Compose components
- Fetch data
- Handle page layout

---

# 8. Server Components Strategy

Default:

```
Server Components
```

Used for:

- Data fetching
- Authentication checks
- Database operations
- Static rendering

Example:

```
Dashboard Page

        |

Fetch Business Data

        |

Render UI
```

---

# 9. Client Components Strategy

Client components only when required.

Use for:

- User interaction
- Forms
- Browser APIs
- Animations
- State management

Example:

```
'use client'

LoginForm

Wizard

Modal

Dropdown
```

---

# 10. Server vs Client Rules

Server:

Allowed:

```
Database access

Environment secrets

Authentication checks
```

---

Client:

Allowed:

```
UI interaction

User state

Browser APIs
```

---

Never:

```
Import server code into client components
```

---

# 11. Data Fetching Strategy

Atlas uses:

## Server First Approach

Preferred:

```
Server Component

      |

Fetch Data

      |

Render UI
```

---

Avoid unnecessary:

```
useEffect()

fetch()

client loading states
```

---

# 12. API Usage Pattern

APIs are used for:

- Client interactions
- External integrations
- Mobile apps
- Background jobs

Example:

```
POST /api/business/create
```

---

Server Components should prefer:

```
Direct service calls
```

instead of:

```
Calling internal API routes
```

---

# 13. State Management

Atlas uses layered state management.

---

## Server State

Handled by:

```
Server Components
```

Examples:

```
Business data

User profile

Dashboard statistics
```

---

## Client State

Handled by:

```
React State

Context

Zustand (future)
```

Examples:

```
Modal state

Wizard state

Filters
```

---

# 14. Form Architecture

Forms follow:

```
Input

 |

React Hook Form

 |

Zod Validation

 |

Server Action/API

 |

Database Transaction
```

---

Example:

```
Create Business Form

        |

Validate

        |

Submit

        |

Create Business
```

---

# 15. Validation Strategy

Validation happens at two levels.

## Client Validation

Purpose:

- Better UX
- Instant feedback

---

## Server Validation

Purpose:

- Security
- Data integrity

---

Rule:

Never trust client validation alone.

---

# 16. Loading States

Every async operation requires:

```
Loading UI
```

Patterns:

```
loading.tsx

Suspense

Skeleton Components
```

---

# 17. Error Handling

Use:

```
error.tsx
```

for route-level errors.

---

API errors:

```json
{
 success:false,
 error:{
   code:"VALIDATION_ERROR",
   message:"Invalid input"
 }
}
```

---

# 18. Design System Strategy

Atlas UI follows:

```
Consistency over customization
```

Components should be:

- Reusable
- Accessible
- Theme-ready
- Responsive

---

Design tokens:

```
Colors

Typography

Spacing

Radius

Shadows
```

---

# 19. Responsive Design

Mobile-first approach:

```
Mobile

↓

Tablet

↓

Desktop
```

---

All features must support:

- Small screens
- Large screens
- Different browsers

---

# 20. Dashboard Architecture

Dashboard follows:

```
Dashboard Layout

        |

Business Context Provider

        |

Navigation

        |

Feature Modules
```

---

Example:

```
Dashboard

├── Overview

├── Customers

├── Finance

├── Settings
```

---

# 21. Authentication UI Flow

Frontend flow:

```
Login Page

      |

Supabase Auth

      |

Session Created

      |

User Profile Check

      |

Dashboard / Onboarding
```

---

# 22. Module Structure Example

Example:

```
modules/

business/

├── components/

├── actions/

├── services/

├── validators/

├── hooks/

└── types/
```

---

# 23. Performance Rules

Optimize:

- Server rendering
- Image optimization
- Code splitting
- Lazy loading
- Component reuse

Avoid:

- Large client components
- Duplicate fetching
- Unnecessary state

---

# 24. Frontend Security Rules

Never expose:

```
SERVICE_ROLE_KEY

DATABASE_URL

Private APIs
```

---

Always:

- Validate server inputs
- Check permissions server-side
- Protect sensitive routes

---

# 25. Development Rules

Every frontend feature must:

- Follow module architecture
- Use TypeScript
- Pass ESLint
- Pass type checking
- Use shared components
- Handle loading states
- Handle errors

---

# 26. Frontend Roadmap

## Phase 1

Completed:

- Next.js setup
- Authentication UI
- Onboarding wizard
- Dashboard foundation

---

## Phase 2

Next:

- Design system
- Business modules
- Permission-aware UI
- Data tables
- Forms

---

## Phase 3

Advanced:

- Offline support
- Advanced caching
- Real-time updates
- Mobile application

---

# Conclusion

Atlas frontend architecture is designed for long-term SaaS scalability.

Next.js App Router provides the application foundation.

Feature-based modules keep development organized.

Server-first rendering improves performance.

Strict client/server boundaries maintain security and maintainability.