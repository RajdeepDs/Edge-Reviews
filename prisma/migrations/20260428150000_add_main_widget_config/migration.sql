-- Add main widget configuration fields
ALTER TABLE "WidgetConfig"
  ADD COLUMN "mainTitle" TEXT NOT NULL DEFAULT 'Reviews',
  ADD COLUMN "mainShowWriteButton" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "mainShowBreakdown" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "mainShowWithPhotosFilter" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "mainDefaultSort" TEXT NOT NULL DEFAULT 'latest',
  ADD COLUMN "mainPageSize" INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN "mainAccentColor" TEXT NOT NULL DEFAULT '#111111';

