import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let firebaseApp: App | null = null;
let firestoreDb: Firestore | null = null;
let storageBucket: any = null;

const isFirebaseConfigured = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else {
      firebaseApp = getApp();
    }

    firestoreDb = getFirestore(firebaseApp);
    storageBucket = getStorage(firebaseApp).bucket();
    console.log("Firebase Cloud Storage & Firestore initialized successfully.");
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin SDK:", err);
  }
}

export { isFirebaseConfigured, firestoreDb, storageBucket, firebaseApp };
