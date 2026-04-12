-- DropForeignKey
ALTER TABLE "student_marks_history" DROP CONSTRAINT "student_marks_history_actionBy_fkey";

-- AlterTable
ALTER TABLE "student_marks_history" ALTER COLUMN "actionBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "student_marks_history" ADD CONSTRAINT "student_marks_history_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
