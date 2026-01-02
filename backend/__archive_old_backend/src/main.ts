import express from "express";
import rideRoutes from "./modules/ride/ride.controller";

const app = express();
app.use(express.json());

app.use("/ride", rideRoutes);

app.listen(3001, () => {
  console.log("Backend running on port 3001");
});
