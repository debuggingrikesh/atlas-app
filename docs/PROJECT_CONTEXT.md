# Project Atlas Context

## Product Name

Project Atlas (temporary codename)

## Product Category

AI Customer Experience Intelligence Platform


## Vision

Transform every customer interaction into actionable business intelligence.

The platform helps local businesses collect feedback, understand customer experience using AI, identify operational problems, and take improvement actions.


## Initial Market

Nepal


## Initial Beta Customer

VXL Education


## First Commercial Vertical

Healthcare Clinics


# Product Philosophy

The product is not a review collection tool.

It is a customer experience intelligence engine.

The core loop:

Customer Interaction
↓
Feedback Collection
↓
AI Understanding
↓
Business Insight
↓
Recommended Action
↓
Improved Experience


# Architecture Philosophy

Build a modular monolith.

Avoid premature microservices.

The system should be scalable but optimized for a solo founder.


# Technology Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Next.js API routes/server actions

Database:
- PostgreSQL
- Prisma ORM

Authentication:
- Supabase Auth


# AI Architecture

AI must be provider agnostic.

Never directly call AI providers from business logic.

Use:

Application
↓
AI Service Layer
↓
AI Provider


Initial provider:
Google Gemini

Future providers:
OpenAI
Claude
Local models


# Multi-Tenant Architecture

The platform supports multiple businesses.

Every business has isolated data.

Core hierarchy:

Platform
 |
 Business
 |
 Branch
 |
 Users
 |
 Feedback


# MVP Scope

Customer:

- QR feedback page
- Rating
- Comment
- Optional contact information


Business:

- Signup
- Business profile
- Branch management
- QR generation
- Feedback inbox
- AI insights dashboard


AI:

- Sentiment analysis
- Category detection
- Severity detection
- Summary generation
- Recommendations


# Engineering Rules

- Use TypeScript.
- Keep modules separated.
- Avoid unnecessary complexity.
- Validate inputs.
- Never trust frontend data.
- Keep original customer feedback immutable.
- Store AI analysis separately.


# Current Development Phase

Phase 1:
Foundation Setup

Goal:

Create production-ready project foundation.