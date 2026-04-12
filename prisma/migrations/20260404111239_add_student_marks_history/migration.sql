-- CreateTable
CREATE TABLE "student_marks_history" (
    "id" SERIAL NOT NULL,
    "studentMarksId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionBy" INTEGER NOT NULL,
    "previousState" JSONB,
    "newState" JSONB NOT NULL,
    "changedFields" JSONB,
    "isRepeated" BOOLEAN,
    "gradeType" TEXT,
    "midTermExam" DOUBLE PRECISION,
    "finalExam" DOUBLE PRECISION,
    "homework" DOUBLE PRECISION,
    "labsProjectResearch" DOUBLE PRECISION,
    "quizzes" DOUBLE PRECISION,
    "participation" DOUBLE PRECISION,
    "attendance" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "letterGrade" TEXT,
    "actionReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_marks_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "student_marks_history" ADD CONSTRAINT "student_marks_history_studentMarksId_fkey" FOREIGN KEY ("studentMarksId") REFERENCES "student_marks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_marks_history" ADD CONSTRAINT "student_marks_history_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
