import { getFirestore, doc, runTransaction } from "firebase/firestore";
import { initializeApp, getApp, getApps } from "firebase/app";

// 🛑 Apni Firebase Config yahan daal (Firebase Console se copy kar)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export const generateSmartId = async (collectionName: string, prefix: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");

    const counterRef = doc(db, "counters", `${collectionName}_${dateStr}`);

    try {
        return await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const count = counterDoc.exists() ? counterDoc.data().count : 0;
            const nextCount = count + 1;

            transaction.set(counterRef, { count: nextCount });

            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            const randomStr = chars.charAt(Math.floor(Math.random() * chars.length));
            
            return `${prefix}-${dateStr}-${String(nextCount).padStart(3, '0')}-${randomStr}`;
        });
    } catch (error) {
        console.error("ID Gen Error:", error);
        throw error;
    }
};