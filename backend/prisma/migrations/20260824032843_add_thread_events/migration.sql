-- CreateTable
CREATE TABLE "ThreadEvent" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "staffId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ThreadEvent" ADD CONSTRAINT "ThreadEvent_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
