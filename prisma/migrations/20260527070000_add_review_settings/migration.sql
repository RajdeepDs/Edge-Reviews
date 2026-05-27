CREATE TABLE "ReviewSettings" (
  "shop" TEXT NOT NULL,
  "importAutoPublish" BOOLEAN NOT NULL DEFAULT true,
  "importDuplicateDetection" BOOLEAN NOT NULL DEFAULT true,
  "importSourceLabel" TEXT NOT NULL DEFAULT 'CSV Import',
  "importMinRating" TEXT NOT NULL DEFAULT '1',
  "autoPublish" BOOLEAN NOT NULL DEFAULT false,
  "minAutoPublishRating" TEXT NOT NULL DEFAULT '4',
  "flagProfanity" BOOLEAN NOT NULL DEFAULT true,
  "requireVerifiedPurchase" BOOLEAN NOT NULL DEFAULT true,
  "minReviewLength" TEXT NOT NULL DEFAULT '10',
  "autoRejectOneStar" BOOLEAN NOT NULL DEFAULT false,
  "showStarRating" BOOLEAN NOT NULL DEFAULT true,
  "showReviewCount" BOOLEAN NOT NULL DEFAULT true,
  "showVerifiedBadge" BOOLEAN NOT NULL DEFAULT true,
  "showReviewerAvatar" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReviewSettings_pkey" PRIMARY KEY ("shop")
);
