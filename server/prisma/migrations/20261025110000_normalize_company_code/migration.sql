UPDATE "companies"
SET "code" = REGEXP_REPLACE("code", '[^a-zA-Z0-9]', '', 'g');
