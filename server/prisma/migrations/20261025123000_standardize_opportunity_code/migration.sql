-- Opportunity codes are global business identifiers, independent from customer codes.
DO $$
DECLARE
  opportunity_count integer;
BEGIN
  SELECT COUNT(*) INTO opportunity_count FROM opportunities;
  IF opportunity_count > 7999 THEN
    RAISE EXCEPTION 'Cannot standardize more than 7999 opportunity codes into OPP-####.';
  END IF;
END $$;

-- A temporary namespace avoids unique-key collisions while existing rows are renumbered.
UPDATE opportunities
SET code = CONCAT('TMP-', id);

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) + 2000 AS sequence
  FROM opportunities
)
UPDATE opportunities AS opportunity
SET code = CONCAT('OPP-', LPAD(numbered.sequence::text, 4, '0'))
FROM numbered
WHERE opportunity.id = numbered.id;

ALTER TABLE opportunities
ADD CONSTRAINT opportunities_code_format_check
CHECK (code ~ '^OPP-[0-9]{4}$');
