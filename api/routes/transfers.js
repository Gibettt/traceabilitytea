import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Transfer log will be added soon" });
});

export default router;
