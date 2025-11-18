import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all batches
router.get("/", async (req, res) => {
    const batches = await prisma.batch.findMany({
        orderBy: { createdAt: "desc" }
    });
    res.json(batches);
});

// GET batch detail
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: { steps: true }
    });

    if (!batch) return res.status(404).json({ error: "Batch not found" });

    res.json(batch);
});

export default router;
