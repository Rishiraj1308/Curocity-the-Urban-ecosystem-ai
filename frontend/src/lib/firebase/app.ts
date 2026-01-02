import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { firebaseConfig, assertFirebaseEnv } from "./config";

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (_app) return _app;

  // Ensure environment is valid
  if (!assertFirebaseEnv()) {
    console.warn("❌ Firebase env missing");
    return null;
  }

  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return _app;
}

// Default export (required by rest of your project)
export const app = getFirebaseApp();
