import express from "express";
import cors from "cors";
import batchRoutes from "./src/routes/batchRoutes.js";
import { scanBatch } from "./src/controllers/batchController.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Traceability API running..." });
});

// endpoint scan untuk QR
app.get("/scan/:id", scanBatch);

// endpoint batch biasa
app.use("/batches", batchRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});
