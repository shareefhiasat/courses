/**
 * Filter quizzes to activities within the user's data scope.
 */

import prisma from '../db/prismaClient.js';
import { getRequestScope, isRecordInScope } from './scopeAccess.js';


export async function filterQuizzesByScope(req, quizzes = []) {
  if (!req?.user || !quizzes.length) return quizzes;

  const scope = await getRequestScope(req);
  if (scope.unrestricted) return quizzes;

  const quizIds = quizzes.map((q) => q.id);
  const activities = await prisma.activity.findMany({
    where: { quizId: { in: quizIds } },
    select: { quizId: true, classId: true, subjectId: true, programId: true, categoryId: true },
  });

  const allowedQuizIds = new Set();
  activities.forEach((activity) => {
    if (isRecordInScope(scope, activity)) {
      allowedQuizIds.add(activity.quizId);
    }
  });

  return quizzes.filter((q) => allowedQuizIds.has(q.id));
}

export default { filterQuizzesByScope };
