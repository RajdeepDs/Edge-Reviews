-- CreateTable
CREATE TABLE "MerchantProfile" (
    "shop" TEXT NOT NULL,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "storeName" TEXT,
    "storeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("shop")
);
