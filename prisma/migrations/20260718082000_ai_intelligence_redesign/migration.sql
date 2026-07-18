-- AlterTable
ALTER TABLE "AIResponse" ADD COLUMN "analysisData" JSONB;

-- Migrate existing text data into a JSON structure
UPDATE "AIResponse" SET "analysisData" = jsonb_build_object('suggestedResponse', "generatedText");

-- Make new column NOT NULL and drop the old one
ALTER TABLE "AIResponse" ALTER COLUMN "analysisData" SET NOT NULL;
ALTER TABLE "AIResponse" DROP COLUMN "generatedText";

-- Alter toneUsed to be optional
ALTER TABLE "AIResponse" ALTER COLUMN "toneUsed" DROP NOT NULL;
