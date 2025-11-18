import dotenv from "dotenv";
dotenv.config();

import { JsonRpcProvider, Contract } from "ethers";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

// fungsi bantu: normalisasi lotId / newLotId
function normalizeIndexedString(value) {
    // kalau sudah string biasa
    if (typeof value === "string") return value;

    // ethers v6 Indexed: { hash: "0x...", _isIndexed: true }
    if (value && typeof value === "object" && "hash" in value) {
        return value.hash; // pakai hash-nya sebagai ID di DB
    }

    // fallback
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
    console.log("❕ Skip catch-up, hanya dengarkan event baru dari sekarang.\n");

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
            const evt = args[args.length - 1]; // event object

            try {
                await handleEvent(eventName, evt, provider);
            } catch (err) {
                console.error(`@TODO Error handleEvent untuk ${eventName}:`, err);
            }
        });
    }
}

async function handleEvent(name, evt, provider) {
    const args = evt.args;

    // blockNumber dan txHash: coba ambil dari beberapa kemungkinan field
    const blockNumber = evt.blockNumber ?? evt.log?.blockNumber;
    const txHash = evt.transactionHash ?? evt.log?.transactionHash;

    const block = await provider.getBlock(blockNumber);
    const blockTime = new Date(block.timestamp * 1000);

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
                createdAt: blockTime,
            },
            update: {}
        });

        console.log("🟢 LotCreated:", lotId);
    }

    if (name === "LotProcessed") {
        const newLotId = normalizeIndexedString(args.newLotId);

        await prisma.step.create({
            data: {
                batchId: newLotId,
                stepType: args.processName,
                actor: args.actor,
                cid: args.ipfsHash,
                ts: blockTime,
                txHash: txHash,
                blockNum: blockNumber,
                blockTime: blockTime,
            }
        });

        console.log("🔵 LotProcessed:", newLotId);
    }

    if (name === "LotTransferred") {
        console.log("🟡 LotTransferred:", normalizeIndexedString(args.lotId));
    }

    if (name === "TransferProposed") {
        console.log("🟠 TransferProposed:", normalizeIndexedString(args.transferId));
    }

    if (name === "TransferAccepted") {
        console.log("🟢 TransferAccepted:", normalizeIndexedString(args.transferId));
    }

    if (name === "TransferCancelled") {
        console.log("🔴 TransferCancelled:", normalizeIndexedString(args.transferId));
    }
}

main().catch(err => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});