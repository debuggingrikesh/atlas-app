/* eslint-disable @typescript-eslint/no-explicit-any */

// Industry module types

export type IndustryTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
