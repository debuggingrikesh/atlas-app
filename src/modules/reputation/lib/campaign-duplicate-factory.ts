import { Prisma } from '@prisma/client';

export class CampaignDuplicateFactory {
  static createDuplicateInput(
    original: { name: string; branchId: string | null; googleReviewUrl: string | null },
    existingNames: string[]
  ): Prisma.ReviewCampaignUncheckedCreateWithoutBusinessInput {
    // Determine base name (strip existing " (Copy X)")
    const baseNameMatch = original.name.match(/^(.*?)(?: \(Copy(?: \d+)?\))?$/);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : original.name.trim();

    // Find next available copy number
    let nextNumber = 1;
    const nameSet = new Set(existingNames);
    let newName = `${baseName} (Copy)`;
    
    while (nameSet.has(newName)) {
      nextNumber++;
      newName = `${baseName} (Copy ${nextNumber})`;
    }

    return {
      name: newName,
      branchId: original.branchId || undefined,
      googleReviewUrl: original.googleReviewUrl || undefined,
    };
  }
}
