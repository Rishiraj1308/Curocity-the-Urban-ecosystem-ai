import { Router } from "express";
import { createRide, dispatchRide } from "./ride.service";

const router = Router();

// 1. Create a new ride
router.post("/create", async (req, res) => {
  try {
    const ride = await createRide(req.body);
    await dispatchRide(ride.data, ride.id);
    return res.json(ride);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// Export router
export default router;
