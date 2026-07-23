/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from 'zod';

export const notificationPaginationSchema = z.object({
  businessId: z.string().min(1, { message: 'Business ID is required' }),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const markAllNotificationsReadSchema = z.object({
  businessId: z.string().min(1, { message: 'Business ID is required' }),
});
