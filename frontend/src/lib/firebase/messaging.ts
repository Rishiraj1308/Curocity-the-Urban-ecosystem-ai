import { getMessaging, isSupported } from "firebase/messaging";
import { app, getFirebaseApp } from "./app";

export const getFirebaseMessaging = async () => {
  if (!app) return null;
  if (!(await isSupported())) return null;
  return getMessaging(app);
};
