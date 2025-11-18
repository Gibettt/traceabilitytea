import dotenv from "dotenv";
dotenv.config();

import { JsonRpcProvider, Contract } from "ethers";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

// --- SAFE FETCHING FOR ALCHEMY ---
// ethers v6 → gunakan provider.getLogs langsung
async function safeQueryLogs(contract, eventFragment, start, end, chunk = 2000) {
    const iface = contract.interface;
    const topic = iface.getEvent(eventFragment).topicHash;

    let logs = [];
    let from = start;

    while (from <= end) {
        const to = Math.min(from + chunk, end);

        try {
            const fetched = await contract.runner.getLogs({
                address: contract.target,
                topics: [topic],
                fromBlock: from,
                toBlock: to
            });

            logs.push(...fetched);
            console.log(`✔️ fetched ${eventFragment} blocks ${from} → ${to}`);
        } catch (err) {
            console.error(`❌ Error fetching ${eventFragment} from ${from} to ${to}`);
            console.log("⏳ Retry after 1s...");
            await new Promise(res => setTimeout(res, 1000));
            continue;
        }

        from = to + 1;
    }

    return logs.map(log => contract.interface.parseLog(log));
}

async function main() {
    // Provider
    const provider = new JsonRpcProvider(process.env.RPC_URL);

    // Load deployment config
    const config = JSON.parse(
        fs.readFileSync("./deployments/11155111/TeaTrace.json", "utf8")
    );

    const contract = new Contract(config.address, config.abi, provider);

    const latest = await provider.getBlockNumber();

    console.log("🚀 Indexer berjalan, startBlock:", config.startBlock);
    console.log("📌 Latest block:", latest);

    const events = [
        "LotCreated",
        "LotProcessed",
        "LotTransferred",
        "TransferProposed",
        "TransferAccepted",
        "TransferCancelled"
    ];

    // --- CATCH-UP LOGS ---
    for (const eventName of events) {
        console.log("\n⏳ Fetching:", eventName);

        const logs = await safeQueryLogs(
            contract,
            eventName,
            config.startBlock,
            latest
        );

        for (const parsed of logs) {
            await handleEvent(eventName, parsed);
        }
    }

    console.log("✔️ Catch-up selesai. Listening real-time...");

    // --- REALTIME LISTEN ---
    for (const eventName of events) {
        contract.on(eventName, async (...args) => {
            const evt = args[args.length - 1];
            const parsed = contract.interface.parseLog(evt.log);
            await handleEvent(eventName, parsed, evt);
        });
    }
}

async function handleEvent(name, evt, raw = null) {
    // evt.args → parameter event
    const args = evt.args;

    // Ambil block data
    const blockNumber = raw?.log?.blockNumber ?? evt.log.blockNumber;
    const txHash = raw?.log?.transactionHash ?? evt.log.transactionHash;

    const provider = new JsonRpcProvider(process.env.RPC_URL);
    const block = await provider.getBlock(blockNumber);

    if (name === "LotCreated") {
        await prisma.batch.upsert({
            where: { id: args.lotId },
            create: {
                id: args.lotId,
                owner: args.actor,
                cid: args.ipfsHash,
                status: "CREATED",
                createdTx: txHash,
                createdBlock: blockNumber,
                createdAt: new Date(block.timestamp * 1000),
            },
            update: {}
        });

        console.log("🟢 LotCreated:", args.lotId);
    }

    if (name === "LotProcessed") {
        await prisma.step.create({
            data: {
                batchId: args.newLotId,
                stepType: args.processName,
                actor: args.actor,
                cid: args.ipfsHash,
                ts: new Date(block.timestamp * 1000),
                txHash: txHash,
                blockNum: blockNumber,
                blockTime: new Date(block.timestamp * 1000),
            }
        });

        console.log("🔵 LotProcessed:", args.newLotId);
    }

    if (name === "LotTransferred") {
        console.log("🟡 LotTransferred:", args.lotId);
    }

    if (name === "TransferProposed") {
        console.log("🟠 TransferProposed:", args.transferId);
    }

    if (name === "TransferAccepted") {
        console.log("🟢 TransferAccepted:", args.transferId);
    }

    if (name === "TransferCancelled") {
        console.log("🔴 TransferCancelled:", args.transferId);
    }
}

main().catch(err => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
});
