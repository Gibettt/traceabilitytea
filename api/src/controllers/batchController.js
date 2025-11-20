import prisma from "../libs/prisma.js";

export const getAllBatches = async (req, res) => {
    try {
        const batches = await prisma.batch.findMany({
            orderBy: { createdAt: "desc" }
        });

        res.json({ success: true, data: batches });
    } catch (err) {
        console.error("getAllBatches error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getBatchById = async (req, res) => {
    try {
        const batch = await prisma.batch.findUnique({
            where: { id: req.params.id }
        });

        if (!batch) {
            return res
                .status(404)
                .json({ success: false, message: "Batch tidak ditemukan" });
        }

        res.json({ success: true, data: batch });
    } catch (err) {
        console.error("getBatchById error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getBatchSteps = async (req, res) => {
    try {
        const steps = await prisma.step.findMany({
            where: { batchId: req.params.id },
            orderBy: { ts: "asc" }
        });

        res.json({ success: true, data: steps });
    } catch (err) {
        console.error("getBatchSteps error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ini yang baru: /scan/:id
export const scanBatch = async (req, res) => {
    try {
        const id = req.params.id;

        const batch = await prisma.batch.findUnique({
            where: { id }
        });

        if (!batch) {
            return res
                .status(404)
                .json({ success: false, message: "Batch tidak ditemukan" });
        }

        const steps = await prisma.step.findMany({
            where: { batchId: id },
            orderBy: { ts: "asc" } // atau blockNum: "asc" kalau mau by block
        });

        res.json({
            success: true,
            data: {
                batch,
                steps
            }
        });
    } catch (err) {
        console.error("scanBatch error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
