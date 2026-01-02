import { getFirestore } from "firebase/firestore";
import { app } from "./app";

let db = null;

if (app) {
  try {
    db = getFirestore(app);
  } catch (e) {
    console.error("🔥 Firestore init failed:", e);
    db = null;
  }
}

export const getDb = () => db;
