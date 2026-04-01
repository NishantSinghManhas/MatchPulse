import express from "express";
import cors from "cors";
import matchRoutes from "./routes/matchRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", matchRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Cricket API running 🚀");
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});