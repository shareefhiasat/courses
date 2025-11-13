const { onCall } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const functions = require('firebase-functions');

exports.createHomeworkSubmission = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { activityId, fileName, fileURL } = data;
  if (!activityId || !fileName || !fileURL) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with arguments "activityId", "fileName", and "fileURL".');
  }

  const db = getFirestore();
  const submissionData = {
    userId: auth.uid,
    userEmail: auth.token.email,
    activityId: activityId,
    fileName: fileName,
    fileURL: fileURL,
    submittedAt: new Date(),
  };

  try {
    const submission = await db.collection('submissions').add(submissionData);
    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Error creating submission:', error);
    throw new functions.https.HttpsError('internal', 'Error creating submission.');
  }
});
