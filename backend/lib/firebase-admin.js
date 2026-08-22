import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production, use a service account key file
// For development, it connects to the emulator or uses default credentials
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // For local development without credentials, initialize with project ID only
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'mybadyettracker-demo',
      });
    }
  } catch (error) {
    console.warn('Firebase Admin init warning:', error.message);
    admin.initializeApp({
      projectId: 'mybadyettracker-demo',
    });
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
