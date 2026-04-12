/*
  Warnings:

  - You are about to drop the column `recordedBy` on the `attendances` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_recordedBy_fkey";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "recordedBy";

-- CreateTable
CREATE TABLE "standup_attendances" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standup_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "standup_attendances_userId_date_key" ON "standup_attendances"("userId", "date");

-- AddForeignKey
ALTER TABLE "standup_attendances" ADD CONSTRAINT "standup_attendances_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standup_attendances" ADD CONSTRAINT "standup_attendances_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "attendance_status_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standup_attendances" ADD CONSTRAINT "standup_attendances_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standup_attendances" ADD CONSTRAINT "standup_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
