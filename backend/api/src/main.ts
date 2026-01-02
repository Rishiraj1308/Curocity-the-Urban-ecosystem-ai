import express from "express";
import cors from "cors";
import rideRoutes from "./routes/ride.routes";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/ride", rideRoutes);

// ⛔ IMPORTANT: yaha app.listen() NAHI hoga.
// Vercel khud server chalata hai.
export default app;
