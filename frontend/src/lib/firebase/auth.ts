import { getAuth } from "firebase/auth";
import { app, getFirebaseApp } from "./app";

export const getFirebaseAuth = () => {
  if (!app) return null;
  return getAuth(app);
};
