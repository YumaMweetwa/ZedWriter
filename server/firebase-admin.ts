import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for Replit environment
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Production: Use service account key explicitly
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      console.log('Initializing Firebase Admin with service account for project:', serviceAccount.project_id);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        // Explicitly disable default credential lookup
        // This prevents the SDK from trying to access metadata servers
      });
      
      console.log('Firebase Admin initialized successfully with service account');
    } else {
      console.error('Firebase service account key not found. This will cause Firestore connection issues.');
      
      // Minimal initialization that will fail for Firestore operations
      // but allows the app to start
      admin.initializeApp({
        projectId: "improvedzedwriter",
      });
      
      console.warn('Firebase Admin initialized without credentials - Firestore operations will fail');
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', (error as Error).message);
    console.error('Service account key might be malformed or invalid');
    
    // Fallback initialization
    admin.initializeApp({
      projectId: "improvedzedwriter",
    });
  }
}

export default admin;