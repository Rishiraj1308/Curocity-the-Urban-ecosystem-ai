import { Router } from "express";
import { createRide } from "../services/ride.service";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const ride = await createRide(req.body);
    return res.json({ success: true, ride });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
