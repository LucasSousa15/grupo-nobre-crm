ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "code" TEXT;
UPDATE "companies"
SET "code" = UPPER(
  TRIM(BOTH '-' FROM REGEXP_REPLACE(
    TRANSLATE("company_name", 'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ))
) || '-' || SUBSTRING(MD5("id") FROM 1 FOR 6);
ALTER TABLE "companies" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");
