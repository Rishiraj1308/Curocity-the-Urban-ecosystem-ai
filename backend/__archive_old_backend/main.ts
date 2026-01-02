import express from "express";
import cors from "cors";
import rideRoutes from "./routes/ride.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/ride", rideRoutes);

app.listen(3001, () => {
  console.log("Express Backend running on port 3001");
});
