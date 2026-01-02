import { getFunctions } from "firebase/functions";
import { app, getFirebaseApp } from "./app";

export const getFirebaseFunctions = () => {
  if (!app) return null;
  return getFunctions(app);
};
