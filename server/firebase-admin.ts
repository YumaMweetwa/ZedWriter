import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // In production, use service account key from environment
  // For development, we'll use the default credentials
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // For development - use actual project ID from environment
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.warn('Firebase Admin initialization skipped:', (error as Error).message);
    // Initialize without credentials for development
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

export default admin;