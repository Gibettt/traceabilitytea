-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdTx" TEXT NOT NULL,
    "createdBlock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "cid" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNum" INTEGER NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
