-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('FOLLOW_UP_DUE', 'FOLLOW_UP_OVERDUE', 'PROPOSAL_EXPIRING', 'PROPOSAL_EXPIRED', 'CUSTOMER_EVENT_APPROACHING');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('OPEN', 'DISMISSED');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_status_due_at_idx" ON "reminders"("status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_opportunity_id_type_due_at_key" ON "reminders"("opportunity_id", "type", "due_at");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
