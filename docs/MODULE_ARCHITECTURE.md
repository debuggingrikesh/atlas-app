# MODULE_ARCHITECTURE.md

# Module Architecture Design

## 1. Overview

Project Atlas is designed as a modular multi-tenant SaaS platform.

The platform separates:

1. Core platform functionality
2. Industry-specific capabilities
3. Tenant-specific configurations

Architecture goal:


One Platform
|
|
Multiple Industries
|
|
Multiple Businesses
|
|
Multiple Modules


Examples:

- Hospital Management System
- Education Management System
- CRM
- ERP
- Accounting
- Inventory
- HR Management
- Project Management


---

# 2. Architecture Principles

## 2.1 Modular Architecture

Each business capability exists as an independent module.

Example:


CRM Module
Inventory Module
Billing Module
HR Module


Modules can be enabled or disabled independently.


## 2.2 Multi-Tenant Architecture

Every module operates inside a business tenant.


User
|
Business
|
Module
|
Data



## 2.3 Industry Driven Architecture

Industries define default module stacks.

Example:


Hospital

Modules:

Patients
Appointments
Billing
Pharmacy



Education

Modules:

Students
Classes
Attendance
Fees


---

# 3. System Layers

Project Atlas consists of four layers:


+--------------------------------+
| Application Layer |
| |
| Dashboard |
| UI Components |
| User Experience |
+--------------------------------+

+--------------------------------+
| Module Layer |
| |
| CRM |
| HMS |
| LMS |
| ERP |
+--------------------------------+

+--------------------------------+
| Business Logic Layer |
| |
| Services |
| Permissions |
| Workflows |
+--------------------------------+

+--------------------------------+
| Core Platform |
| |
| Auth |
| Tenants |
| Users |
| Audit |
| Billing |
+--------------------------------+



---

# 4. Core Platform

The core platform exists for every tenant.

## Authentication

Responsible for:

- Login
- Sessions
- User identity


## Tenant Management

Responsible for:

- Businesses
- Branches
- Memberships


## Authorization

Responsible for:

- Roles
- Permissions
- Access control


## Audit System

Responsible for:

- User activity tracking
- Security events
- Change history


---

# 5. Module Structure

Every module follows a standard structure.

Example:


modules/
|
├── crm/
│ |
│ ├── components/
│ ├── services/
│ ├── api/
│ ├── permissions/
│ ├── schemas/
│ └── types/
|
├── inventory/
|
└── billing/



---

# 6. Module Definition

Every module must define:


Module Metadata


Example:

```ts
{
 id: "crm",
 name: "Customer Relationship Management",
 version: "1.0",
 category: "sales",
 permissions: [],
 dependencies: []
}
7. Industry Template System

Industries define default module packages.

IndustryTemplate

Hospital
 |
 +-- HMS
 +-- Billing
 +-- Inventory


Education
 |
 +-- LMS
 +-- Fees
 +-- Attendance
8. Module Activation

Modules are activated at business level.

Flow:

Industry Template
        |
        v
Available Modules
        |
        v
Business Selection
        |
        v
Enabled Modules

Example:

Hospital can enable:

Patients
Appointments
Pharmacy
Billing

and disable:

HR
Payroll
9. Tenant Module Configuration

Each business can customize modules.

Business
 |
Module Configuration
 |
Settings
 |
Permissions

Configuration example:

{
 "enabled": true,
 "settings": {
   "currency": "NPR",
   "timezone": "Asia/Kathmandu"
 }
}
10. Module Permissions

Modules integrate with RBAC.

Example:

CRM permissions:

crm.customer.create

crm.customer.update

crm.customer.delete

crm.customer.view

Permission hierarchy:

OWNER
 |
ADMIN
 |
MEMBER
11. Module Data Isolation

Every module must respect tenant boundaries.

Required pattern:

Every Table
        |
        v
businessId

Example:

Customer

{
 id
 businessId
 name
 email
}

No module can access another tenant's data.

12. Module Communication

Modules communicate through:

Services

Example:

BillingService.createInvoice()
Events

Example:

AppointmentCreated

InvoiceGenerated

PaymentCompleted
13. Event Architecture

Future event system:

Module A

Creates Event

        |

Event Bus

        |

Module B Reacts

Example:

Appointment Completed

        |

Billing Module

        |

Generate Invoice
14. Module Dependencies

Modules can define dependencies.

Example:

Pharmacy Module

Requires:

Inventory Module
Billing Module

Dependency graph:

Pharmacy
   |
   +-- Inventory
   |
   +-- Billing
15. Module Lifecycle

Each module follows:

Created
 |
Installed
 |
Configured
 |
Activated
 |
Used
 |
Disabled
 |
Removed
16. Module Installation Flow
Business Owner

        |
        v

Select Module

        |
        v

Validate Dependencies

        |
        v

Create Configuration

        |
        v

Enable Module

        |
        v

Module Available
17. Frontend Architecture

Modules provide:

Pages
Components
Navigation items
Dashboard widgets

Example:

Dashboard

[
 CRM Widget

 Inventory Widget

 Billing Widget
]
18. Backend Architecture

Modules provide:

API routes
Services
Database models
Validation schemas
Business logic

Example:

/api/modules/crm/customers

/api/modules/inventory/products
19. Database Strategy
Shared Database Model

All tenants share database.

Isolation through:

businessId

Advantages:

Easier maintenance
Lower infrastructure cost
Faster development

Future option:

Dedicated database per enterprise tenant.

20. Current MVP Module Status

Implemented:

Core Platform

✓ Authentication
✓ User Profiles
✓ Business
✓ Branch
✓ Membership
✓ RBAC Foundation
✓ Audit Foundation

Planned modules:

CRM

Hospital Management System

Education Management System

Inventory

Accounting

HR

Analytics
21. Future Marketplace Vision

Long-term:

Businesses can discover and install modules.

Example:

Atlas Marketplace

Available Apps:

Hospital Suite
School Suite
CRM Suite
Retail Suite
22. Design Rules

Every module must:

Be independently maintainable
Respect tenant isolation
Use shared authentication
Use shared authorization
Maintain audit logs
Avoid direct dependency on unrelated modules
Follow common coding standards