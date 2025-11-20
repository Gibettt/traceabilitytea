import dotenv from "dotenv";
dotenv.config();

import { JsonRpcProvider, Contract } from "ethers";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

// Helper: ubah nilai indexed string ethers v6 jadi string biasa
function normalizeIndexedString(value) {
    if (typeof value === "string") return value;

    // ethers v6: Indexed<string> biasanya punya .hash
    if (value && typeof value.hash === "string") return value.hash;

    if (value && typeof value.toString === "function") {
        return value.toString();
    }

    return String(value);
}

async function main() {
    const provider = new JsonRpcProvider(process.env.RPC_URL);

    const config = JSON.parse(
        fs.readFileSync("./deployments/11155111/TeaTrace.json", "utf8")
    );

    const contract = new Contract(config.address, config.abi, provider);

    const latest = await provider.getBlockNumber();
    console.log("🚀 Indexer realtime berjalan");
    console.log("📌 Latest block di RPC:", latest);
    console.log("❕ Skip catch-up, hanya dengarkan event baru dari sekarang.");

    const events = [
        "LotCreated",
        "LotProcessed",
        "LotTransferred",
        "TransferProposed",
        "TransferAccepted",
        "TransferCancelled"
    ];

    for (const eventName of events) {
        contract.on(eventName, async (...args) => {
            const evt = args[args.length - 1]; // objek event ethers
            try {
                await handleEvent(eventName, evt);
            } catch (err) {
                console.error(`@TODO Error handleEvent untuk ${eventName}:`, err);
            }
        });
    }
}

async function handleEvent(name, evt) {
    const args = evt.args;

    const blockNumber = evt.log.blockNumber;
    const txHash = evt.log.transactionHash;

    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const block = await provider.getBlock(blockNumber);

    if (name === "LotCreated") {
        const lotId = normalizeIndexedString(args.lotId);

        await prisma.batch.upsert({
            where: { id: lotId },
            create: {
                id: lotId,
                owner: args.actor,
                cid: args.ipfsHash,
                status: "CREATED",
                createdTx: txHash,
                createdBlock: blockNumber,
                createdAt: new Date(block.timestamp * 1000)
            },
            update: {}
        });

        console.log("🟢 LotCreated:", lotId);
    }

    if (name === "LotProcessed") {
        // ini yang tadi error: pastikan VARIABEL didefinisikan dulu
        const newLotId = normalizeIndexedString(args.newLotId);

        // 1. pastikan batch untuk newLotId ada
        await prisma.batch.upsert({
            where: { id: newLotId },
            create: {
                id: newLotId,
                owner: args.actor,
                cid: args.ipfsHash,
                status: "PROCESSED",
                createdTx: txHash,
                createdBlock: blockNumber,
                createdAt: new Date(block.timestamp * 1000)
            },
            update: {}
        });

        // 2. simpan step-nya
        await prisma.step.create({
            data: {
                batchId: newLotId,
                stepType: args.processName,
                actor: args.actor,
                cid: args.ipfsHash,
                ts: new Date(block.timestamp * 1000),
                txHash: txHash,
                blockNum: blockNumber,
                blockTime: new Date(block.timestamp * 1000)
            }
        });

        console.log("🔵 LotProcessed:", newLotId);
    }

    if (name === "LotTransferred") {
        const lotId = normalizeIndexedString(args.lotId);
        console.log("🟡 LotTransferred:", lotId);
    }

    if (name === "TransferProposed") {
        const transferId = normalizeIndexedString(args.transferId);
        console.log("🟠 TransferProposed:", transferId);
    }

    if (name === "TransferAccepted") {
        const transferId = normalizeIndexedString(args.transferId);
        console.log("🟢 TransferAccepted:", transferId);
    }

    if (name === "TransferCancelled") {
        const transferId = normalizeIndexedString(args.transferId);
        console.log("🔴 TransferCancelled:", transferId);
    }
}

main().catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});