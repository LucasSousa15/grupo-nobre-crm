DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "opportunities" WHERE "customer_event_at" IS NULL) THEN
    RAISE EXCEPTION 'Cannot require customer_event_at while opportunities without an event date still exist.';
  END IF;
END $$;

ALTER TABLE "opportunities" ALTER COLUMN "customer_event_at" SET NOT NULL;
