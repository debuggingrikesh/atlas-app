# API Reference & Standards

## Standard Response Format

All API routes must return a JSON response adhering to one of the following formats.

### Success Response

```json
{
  "success": true,
  "data": {
    "key": "value"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed Zod validation |
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Session valid but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate slug) |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

## Implementation

Use the factory functions from `src/lib/api/response.ts` in your route handlers:

```typescript
import { successResponse, errorResponse } from "@/lib/api/response";

// Success
return successResponse({ id: 123 }, 200);

// Error
return errorResponse("VALIDATION_ERROR", "Invalid input", 400);
```

## Endpoints

### `GET /api/health`
Health check endpoint.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2023-10-27T10:00:00.000Z"
  }
}
```
