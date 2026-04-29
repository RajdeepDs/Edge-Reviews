/*
  Warnings:

  - You are about to drop the column `masonryAccentColor` on the `WidgetConfig` table. All the data in the column will be lost.
  - You are about to drop the column `masonryColumns` on the `WidgetConfig` table. All the data in the column will be lost.
  - You are about to drop the column `masonryShowBadge` on the `WidgetConfig` table. All the data in the column will be lost.
  - You are about to drop the column `masonryShowName` on the `WidgetConfig` table. All the data in the column will be lost.
  - You are about to drop the column `masonryShowRating` on the `WidgetConfig` table. All the data in the column will be lost.
  - You are about to drop the column `masonryTileColor` on the `WidgetConfig` table. All the data in the column will be lost.
  - You are about to drop the column `masonryTitle` on the `WidgetConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WidgetConfig" DROP COLUMN "masonryAccentColor",
DROP COLUMN "masonryColumns",
DROP COLUMN "masonryShowBadge",
DROP COLUMN "masonryShowName",
DROP COLUMN "masonryShowRating",
DROP COLUMN "masonryTileColor",
DROP COLUMN "masonryTitle";
