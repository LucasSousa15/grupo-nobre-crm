ALTER TABLE "companies" ADD COLUMN "code" TEXT;
UPDATE "companies" SET "code" = 'CMP-' || UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 8));
ALTER TABLE "companies" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");
