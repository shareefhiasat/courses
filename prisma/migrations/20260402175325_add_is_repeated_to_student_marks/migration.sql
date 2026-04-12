/*
  Warnings:

  - A unique constraint covering the columns `[userId,subjectId,classId,isRepeated]` on the table `student_marks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "student_marks_userId_subjectId_classId_key";

-- AlterTable
ALTER TABLE "student_marks" ADD COLUMN     "isRepeated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "student_marks_userId_subjectId_classId_isRepeated_key" ON "student_marks"("userId", "subjectId", "classId", "isRepeated");
