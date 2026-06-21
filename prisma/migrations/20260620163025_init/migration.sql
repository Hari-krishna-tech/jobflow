-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('APPLIED', 'ASSESSMENT', 'INTERVIEW', 'HR_ROUND', 'OFFER', 'REJECTED', 'GHOSTED');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('EMAIL', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "location" TEXT,
    "jobUrl" TEXT,
    "salary" TEXT,
    "appliedDate" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "recruiter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "actionRequired" TEXT,
    "detectedStatus" "JobStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "source" "TaskSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Job_userId_status_idx" ON "Job"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Email_gmailMessageId_key" ON "Email"("gmailMessageId");

-- CreateIndex
CREATE INDEX "Email_userId_receivedAt_idx" ON "Email"("userId", "receivedAt");

-- CreateIndex
CREATE INDEX "Task_userId_completed_idx" ON "Task"("userId", "completed");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
