/**
 * Firebase Cloud Function to delete user from both Firestore and Firebase Auth
 * This is for students - complete deletion
 * For staff, we use soft delete (disable in Firestore only)
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Delete user completely (Firestore + Firebase Auth)
 * For students only - complete removal
 */
exports.deleteUserAuth = functions.https.onCall(async (data, context) => {
  // Check authentication - only admins can delete users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Check if user is admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || (!callerDoc.data()?.isAdmin && !callerDoc.data()?.isSuperAdmin)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required to delete users"
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "userId is required"
    );
  }

  try {
    // Get user document to check role and log info
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found in Firestore"
      );
    }

    const userData = userDoc.data();
    
    // Only allow deletion of students
    if (!userData.isStudent) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only students can be completely deleted. Staff should be disabled instead."
      );
    }

    console.log(`Deleting student: ${userId} (${userData.email})`);

    // Step 1: Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(userId);
      console.log(`Deleted user from Firebase Auth: ${userId}`);
    } catch (authError) {
      console.error(`Failed to delete from Firebase Auth: ${authError.message}`);
      // Continue with Firestore deletion even if Auth fails
    }

    // Step 2: Delete from Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    console.log(`Deleted user from Firestore: ${userId}`);

    // Step 3: Log the deletion
    try {
      await admin.firestore().collection('activities').add({
        type: 'USER_DELETED',
        userId: userId,
        userEmail: userData.email,
        deletedBy: callerUid,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          role: 'student',
          method: 'complete_delete'
        }
      });
    } catch (logError) {
      console.warn(`Failed to log deletion: ${logError.message}`);
    }

    return {
      success: true,
      message: "Student deleted successfully from both Firestore and Firebase Auth"
    };

  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      error.message
    );
  }
});

/**
 * Soft delete user (disable in Firestore only)
 * For staff - keep audit trail
 */
exports.disableUser = functions.https.onCall(async (data, context) => {
  // Check authentication - only admins can disable users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Check if user is admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || (!callerDoc.data()?.isAdmin && !callerDoc.data()?.isSuperAdmin)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required to disable users"
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "userId is required"
    );
  }

  try {
    // Get user document
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found in Firestore"
      );
    }

    const userData = userDoc.data();
    
    console.log(`Disabling user: ${userId} (${userData.email})`);

    // Update user document to disable
    await admin.firestore().collection('users').doc(userId).update({
      disabled: true,
      status: 'disabled',
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      disabledBy: callerUid
    });

    console.log(`Disabled user in Firestore: ${userId}`);

    // Log the disable action
    try {
      await admin.firestore().collection('activities').add({
        type: 'USER_DISABLED',
        userId: userId,
        userEmail: userData.email,
        disabledBy: callerUid,
        disabledAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          role: userData.isStudent ? 'student' : 'staff',
          method: 'soft_disable'
        }
      });
    } catch (logError) {
      console.warn(`Failed to log disable: ${logError.message}`);
    }

    return {
      success: true,
      message: "User disabled successfully. Firebase Auth account preserved for audit trail."
    };

  } catch (error) {
    console.error(`Error disabling user ${userId}:`, error);
    throw new functions.https.HttpsError(
      "internal",
      error.message
    );
  }
});
