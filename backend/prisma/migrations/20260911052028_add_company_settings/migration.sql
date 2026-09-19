-- CreateTable
CREATE TABLE "CompanySetting" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Zenith Support',
    "logoUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "landingTitle" TEXT NOT NULL DEFAULT 'Modern Ticketing, Seamless Support.',
    "landingSubtitle" TEXT NOT NULL DEFAULT 'A powerful, real-time helpdesk platform designed to streamline your customer support workflow. Built for speed, scalability, and simplicity.',
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "address" TEXT,

    CONSTRAINT "CompanySetting_pkey" PRIMARY KEY ("id")
);
