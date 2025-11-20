import express from "express";
import {
    getAllBatches,
    getBatchById,
    getBatchSteps
} from "../controllers/batchController.js";

const router = express.Router();

router.get("/", getAllBatches);
router.get("/:id", getBatchById);
router.get("/:id/steps", getBatchSteps);

export default router;