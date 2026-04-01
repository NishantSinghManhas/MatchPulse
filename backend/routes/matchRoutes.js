import express from "express";

const router = express.Router();

router.get("/matches", (req, res) => {
  res.json({ message: "Matches route working ✅" });
});

export default router;