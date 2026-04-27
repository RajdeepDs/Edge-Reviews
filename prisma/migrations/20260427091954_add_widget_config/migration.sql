-- CreateTable
CREATE TABLE "WidgetConfig" (
    "shop" TEXT NOT NULL,
    "fanTitle" TEXT NOT NULL DEFAULT 'From our customers',
    "fanShowRating" BOOLEAN NOT NULL DEFAULT true,
    "fanShowName" BOOLEAN NOT NULL DEFAULT true,
    "fanShowBadge" BOOLEAN NOT NULL DEFAULT true,
    "fanAccentColor" TEXT NOT NULL DEFAULT '#ffffff',
    "cardTitle" TEXT NOT NULL DEFAULT 'What our customers say',
    "cardShowRating" BOOLEAN NOT NULL DEFAULT true,
    "cardShowName" BOOLEAN NOT NULL DEFAULT true,
    "cardShowBadge" BOOLEAN NOT NULL DEFAULT true,
    "cardShowProduct" BOOLEAN NOT NULL DEFAULT true,
    "cardMaxChars" INTEGER NOT NULL DEFAULT 120,
    "cardAccentColor" TEXT NOT NULL DEFAULT '#000000',
    "masonryTitle" TEXT NOT NULL DEFAULT 'From our customers',
    "masonryColumns" INTEGER NOT NULL DEFAULT 4,
    "masonryShowRating" BOOLEAN NOT NULL DEFAULT true,
    "masonryShowName" BOOLEAN NOT NULL DEFAULT true,
    "masonryShowBadge" BOOLEAN NOT NULL DEFAULT true,
    "masonryTileColor" TEXT NOT NULL DEFAULT '#8fad88',
    "masonryAccentColor" TEXT NOT NULL DEFAULT '#000000',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetConfig_pkey" PRIMARY KEY ("shop")
);
