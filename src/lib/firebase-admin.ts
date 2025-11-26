import * as admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    const defaultApp = admin.apps[0];
    if (defaultApp) {
        return getDatabase(defaultApp);
    }
  }
  
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return getDatabase(app);
}

const adminDb = initializeAdminApp();
export { adminDb };
