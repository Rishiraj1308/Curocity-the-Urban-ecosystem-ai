'use client';

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { firebaseConfig, assertFirebaseEnv } from "./config";

import { getFirebaseAuth } from './auth';
import { getDb } from './firestore';
import { getFirebaseFunctions } from './functions';
import { getFirebaseMessaging } from './messaging';
import type { Messaging } from 'firebase/messaging';

// ✔ Correct App Initialization
let app: FirebaseApp | null = null;

if (assertFirebaseEnv()) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
} else {
    console.warn("🚨 Firebase environment variables missing!");
    app = null;
}

// ✔ Safe service initialization
const auth = app ? getFirebaseAuth() : null;
const db = app ? getDb() : null;
const functions = app ? getFirebaseFunctions() : null;

// ✔ Messaging handled only in browser
let messaging: Promise<Messaging | null> | null = null;
if (typeof window !== "undefined" && app) {
    messaging = getFirebaseMessaging();
}

// ✔ Re-export Provider
export * from './client-provider';

// ✔ Export initialized services
export { app, auth, db, functions, messaging };
