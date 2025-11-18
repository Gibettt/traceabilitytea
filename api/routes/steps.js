import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET all steps
router.get("/", async (req, res) => {
    const steps = await prisma.step.findMany({
        orderBy: { blockNum: "desc" }
    });
    res.json(steps);
});

// GET steps by batch
router.get("/batch/:id", async (req, res) => {
    const { id } = req.params;

    const steps = await prisma.step.findMany({
        where: { batchId: id },
        orderBy: { blockNum: "asc" }
    });

    res.json(steps);
});

export default router;
