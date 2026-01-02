import { db } from "../utils/firebaseAdmin";

export const createRide = async (data: any) => {
  const ref = await db.collection("rides").add({
    ...data,
    status: "searching",
    createdAt: Date.now(),
  });

  return { id: ref.id };
};
